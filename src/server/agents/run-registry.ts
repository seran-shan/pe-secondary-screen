import { randomUUID } from "crypto";
import { kv } from "@vercel/kv";
import { pusherServer } from "@/lib/pusher.server";

export type StepId =
  | "finder"
  | "extractor"
  | "normalizer"
  | "enricher"
  | "writer";

export type StepStatus =
  | "pending"
  | "running"
  | "completed"
  | "error"
  | "cancelled";

export type RunStatus =
  | "pending"
  | "running"
  | "completed"
  | "error"
  | "cancelled";

export interface StepState {
  id: StepId;
  status: StepStatus;
  count?: number;
  error?: string;
  startedAt?: number;
  endedAt?: number;
}

export interface RunState {
  runId: string;
  sponsorName: string;
  sponsorId?: string;
  userId?: string | null;
  mode: "append" | "update" | "replace";
  status: RunStatus;
  currentStepId?: StepId;
  steps: Record<StepId, StepState>;
  totals: {
    portfolioUrls?: number;
    crawled?: number;
    extracted?: number;
    normalized?: number;
    enriched?: number;
    added?: number;
  };
  createdAt: number;
  updatedAt: number;
  endedAt?: number;
  error?: string;
  cancelled?: boolean;
}

const initialSteps = (): Record<StepId, StepState> => ({
  finder: { id: "finder", status: "pending" },
  extractor: { id: "extractor", status: "pending" },
  normalizer: { id: "normalizer", status: "pending" },
  enricher: { id: "enricher", status: "pending" },
  writer: { id: "writer", status: "pending" },
});

class RunRegistry {
  private ttlSeconds = 60 * 60; // 1 hour retention
  private memRuns = new Map<string, RunState>();
  private kvAvailable =
    typeof process !== "undefined" &&
    !!process.env.KV_REST_API_URL &&
    !!process.env.KV_REST_API_TOKEN;

  private key(runId: string) {
    return `agent:run:${runId}`;
  }

  private activeSponsorKey(sponsorId: string) {
    return `agent:active:sponsor:${sponsorId}`;
  }

  private activeUserKey(userId: string) {
    return `agent:active:user:${userId}`;
  }

  private startLockKey(sponsorId: string) {
    return `agent:lock:start:${sponsorId}`;
  }

  async withStartLock<T>(sponsorId: string, fn: () => Promise<T>): Promise<T> {
    if (!this.kvAvailable) return await fn();
    const key = this.startLockKey(sponsorId);
    // best-effort NX lock with short TTL
    try {
      const acquired = await kv.set(key, "1", { nx: true, ex: 10 });
      if (!acquired) {
        // small wait and attempt to read active run instead of proceeding
        await new Promise((r) => setTimeout(r, 250));
        return await fn();
      }
      try {
        const result = await fn();
        return result;
      } finally {
        try {
          await kv.del(key);
        } catch {}
      }
    } catch (e) {
      console.error("[Agent] Failed to acquire start lock for", sponsorId, e);
      return await fn();
    }
  }

  private async write(run: RunState) {
    // Always publish the update
    void pusherServer.trigger(`run-${run.runId}`, "update", run);

    if (this.kvAvailable) {
      try {
        await kv.set(this.key(run.runId), run, { ex: this.ttlSeconds });
        return;
      } catch {
        // fall through to memory
      }
    }
    this.memRuns.set(run.runId, run);
  }

  private async read(runId: string): Promise<RunState | undefined> {
    if (this.kvAvailable) {
      try {
        const data = (await kv.get<RunState>(this.key(runId))) ?? undefined;
        if (data) return data;
      } catch {
        // fall through to memory
      }
    }
    return this.memRuns.get(runId);
  }

  async createRun(
    sponsorName: string,
    mode: RunState["mode"],
    sponsorId?: string,
    userId?: string | null,
  ): Promise<RunState> {
    const runId = randomUUID();
    const now = Date.now();
    const state: RunState = {
      runId,
      sponsorName,
      sponsorId,
      userId: userId ?? null,
      mode,
      status: "pending",
      steps: initialSteps(),
      totals: {},
      createdAt: now,
      updatedAt: now,
    };
    await this.write(state);
    // Store active mapping for idempotency
    try {
      if (this.kvAvailable) {
        if (sponsorId)
          await kv.set(this.activeSponsorKey(sponsorId), runId, {
            ex: this.ttlSeconds,
          });
        if (userId)
          await kv.set(this.activeUserKey(userId), runId, {
            ex: this.ttlSeconds,
          });
      }
    } catch {}
    console.log("[Agent] Starting portfolio discovery for", sponsorName);
    return state;
  }

  async getRun(runId: string): Promise<RunState | undefined> {
    return await this.read(runId);
  }

  async startRun(runId: string) {
    const run = await this.read(runId);
    if (!run) return;
    run.status = "running";
    run.updatedAt = Date.now();
    await this.write(run);
    console.log("[Agent] Run started", runId);
  }

  async completeRun(runId: string) {
    const run = await this.read(runId);
    if (!run) return;
    run.status = "completed";
    run.endedAt = Date.now();
    run.updatedAt = run.endedAt;
    await this.write(run);
    await this.clearActiveMappings(run);
    console.log("[Agent] Portfolio discovery complete");
  }

  async failRun(runId: string, error: string) {
    const run = await this.read(runId);
    if (!run) return;
    run.status = "error";
    run.error = error;
    run.endedAt = Date.now();
    run.updatedAt = run.endedAt;
    await this.write(run);
    await this.clearActiveMappings(run);
    console.error("[Agent] Run failed", runId, error);
  }

  async cancelRun(runId: string) {
    const run = await this.read(runId);
    if (!run) return;
    run.cancelled = true;
    run.status = "cancelled";
    run.endedAt = Date.now();
    run.updatedAt = run.endedAt;
    await this.write(run);
    await this.clearActiveMappings(run);
    console.warn("[Agent] Run cancelled", runId);
  }

  async isCancelled(runId: string): Promise<boolean> {
    const run = await this.read(runId);
    return run?.cancelled === true;
  }

  async stepStart(runId: string, stepId: StepId) {
    const run = await this.read(runId);
    if (!run) return;
    run.currentStepId = stepId;
    const step = run.steps[stepId];
    step.status = "running";
    step.startedAt = Date.now();
    run.updatedAt = Date.now();
    await this.write(run);
    console.log("[Agent] Step start", stepId);
  }

  async stepProgress(
    runId: string,
    stepId: StepId,
    count: number,
    totals?: Partial<RunState["totals"]>,
  ) {
    const run = await this.read(runId);
    if (!run) return;
    const step = run.steps[stepId];
    step.count = count;
    if (totals) run.totals = { ...run.totals, ...totals };
    run.updatedAt = Date.now();
    await this.write(run);
  }

  async stepComplete(
    runId: string,
    stepId: StepId,
    count?: number,
    totals?: Partial<RunState["totals"]>,
  ) {
    const run = await this.read(runId);
    if (!run) return;
    const step = run.steps[stepId];
    step.status = "completed";
    if (typeof count === "number") step.count = count;
    step.endedAt = Date.now();
    if (totals) run.totals = { ...run.totals, ...totals };
    run.updatedAt = Date.now();
    await this.write(run);
    console.log("[Agent] Step complete", stepId, step.count ?? 0);
  }

  async stepError(runId: string, stepId: StepId, error: string) {
    const run = await this.read(runId);
    if (!run) return;
    const step = run.steps[stepId];
    step.status = "error";
    step.error = error;
    step.endedAt = Date.now();
    run.status = "error";
    run.error = error;
    run.updatedAt = Date.now();
    await this.write(run);
    await this.clearActiveMappings(run);
    console.error("[Agent] Step error", runId, stepId, error);
  }

  private async clearActiveMappings(run: RunState) {
    if (!this.kvAvailable) return;
    try {
      const ops: Array<Promise<string | number | boolean | null>> = [];
      if (run.sponsorId) ops.push(kv.del(this.activeSponsorKey(run.sponsorId)));
      if (run.userId) ops.push(kv.del(this.activeUserKey(run.userId)));
      await Promise.all(ops);
    } catch {}
  }

  async getActiveRunForSponsor(
    sponsorId: string,
  ): Promise<RunState | undefined> {
    if (!this.kvAvailable) return undefined;
    try {
      const runId =
        (await kv.get<string>(this.activeSponsorKey(sponsorId))) ?? undefined;
      if (!runId) return undefined;
      const run = await this.read(runId);
      if (!run) return undefined;
      if (["completed", "error", "cancelled"].includes(run.status)) {
        await kv.del(this.activeSponsorKey(sponsorId));
        return undefined;
      }
      return run;
    } catch {
      return undefined;
    }
  }

  async getActiveRunForUser(userId: string): Promise<RunState | undefined> {
    if (!this.kvAvailable) return undefined;
    try {
      const runId =
        (await kv.get<string>(this.activeUserKey(userId))) ?? undefined;
      if (!runId) return undefined;
      const run = await this.read(runId);
      if (!run) return undefined;
      if (["completed", "error", "cancelled"].includes(run.status)) {
        await kv.del(this.activeUserKey(userId));
        return undefined;
      }
      return run;
    } catch {
      return undefined;
    }
  }
}

// Ensure singleton across Next.js dev HMR and route re-evaluations
const globalForRunRegistry = globalThis as unknown as {
  __RUN_REGISTRY__?: RunRegistry;
};

// If the instance exists but lacks newly added methods (e.g., after HMR), recreate it
const existingRegistry = globalForRunRegistry.__RUN_REGISTRY__ as
  | (RunRegistry & Record<string, unknown>)
  | undefined;

export const runRegistry: RunRegistry =
  existingRegistry && typeof existingRegistry.withStartLock === "function"
    ? (existingRegistry as RunRegistry)
    : (globalForRunRegistry.__RUN_REGISTRY__ = new RunRegistry());
