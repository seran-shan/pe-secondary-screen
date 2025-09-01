import { randomUUID } from "crypto";

export type StepId =
  | "finder"
  | "crawler"
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
  };
  createdAt: number;
  updatedAt: number;
  endedAt?: number;
  error?: string;
  cancelled?: boolean;
}

const initialSteps = (): Record<StepId, StepState> => ({
  finder: { id: "finder", status: "pending" },
  crawler: { id: "crawler", status: "pending" },
  extractor: { id: "extractor", status: "pending" },
  normalizer: { id: "normalizer", status: "pending" },
  enricher: { id: "enricher", status: "pending" },
  writer: { id: "writer", status: "pending" },
});

class RunRegistry {
  private runs = new Map<string, RunState>();
  private cache = new Map<string, { data: RunState; expires: number }>();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Cleanup old runs every 5 minutes
    this.cleanupInterval = setInterval(
      () => {
        this.cleanup();
      },
      5 * 60 * 1000,
    );
  }

  private cleanup() {
    const now = Date.now();
    const cutoff = 10 * 60 * 1000; // 10 minutes

    // Clean up completed runs older than 10 minutes
    for (const [runId, run] of this.runs.entries()) {
      if (run.endedAt && now - run.endedAt > cutoff) {
        this.runs.delete(runId);
        this.cache.delete(runId);
        // Silently clean up old runs
      }
    }

    // Clean up expired cache entries
    for (const [runId, cached] of this.cache.entries()) {
      if (cached.expires < now) {
        this.cache.delete(runId);
      }
    }
  }

  createRun(sponsorName: string, mode: RunState["mode"]): RunState {
    const runId = randomUUID();
    const now = Date.now();
    const state: RunState = {
      runId,
      sponsorName,
      mode,
      status: "pending",
      steps: initialSteps(),
      totals: {},
      createdAt: now,
      updatedAt: now,
    };
    this.runs.set(runId, state);
    console.log(`[Agent] Starting ${sponsorName} portfolio discovery`);
    return state;
  }

  getRun(runId: string, useCache = false): RunState | undefined {
    // Check cache first if enabled
    if (useCache) {
      const cached = this.cache.get(runId);
      if (cached && cached.expires > Date.now()) {
        return cached.data;
      }
    }

    const run = this.runs.get(runId);

    // Cache the result if caching is enabled
    if (run && useCache) {
      this.cache.set(runId, {
        data: run,
        expires: Date.now() + 1000, // Cache for 1 second
      });
    }

    return run;
  }

  startRun(runId: string) {
    const run = this.runs.get(runId);
    if (!run) return;
    run.status = "running";
    run.updatedAt = Date.now();
    console.log(`[Agent:${runId}] Run started`);
  }

  completeRun(runId: string) {
    const run = this.runs.get(runId);
    if (!run) return;
    run.status = "completed";
    run.endedAt = Date.now();
    run.updatedAt = run.endedAt;
    console.log(`[Agent] Portfolio discovery complete`);
  }

  failRun(runId: string, error: string) {
    const run = this.runs.get(runId);
    if (!run) return;
    run.status = "error";
    run.error = error;
    run.endedAt = Date.now();
    run.updatedAt = run.endedAt;
    console.error(`[Agent:${runId}] Run failed: ${error}`);
  }

  cancelRun(runId: string) {
    const run = this.runs.get(runId);
    if (!run) return;
    run.cancelled = true;
    run.status = "cancelled";
    run.endedAt = Date.now();
    run.updatedAt = run.endedAt;
    console.warn(`[Agent:${runId}] Run cancelled`);
  }

  isCancelled(runId: string): boolean {
    return this.runs.get(runId)?.cancelled === true;
  }

  stepStart(runId: string, stepId: StepId) {
    const run = this.runs.get(runId);
    if (!run) return;
    run.currentStepId = stepId;
    const step = run.steps[stepId];
    step.status = "running";
    step.startedAt = Date.now();
    run.updatedAt = Date.now();
    console.log(`[Agent] ${stepId}`);
  }

  stepProgress(
    runId: string,
    stepId: StepId,
    count: number,
    totals?: Partial<RunState["totals"]>,
  ) {
    const run = this.runs.get(runId);
    if (!run) return;
    const step = run.steps[stepId];
    step.count = count;
    if (totals) run.totals = { ...run.totals, ...totals };
    run.updatedAt = Date.now();
  }

  stepComplete(
    runId: string,
    stepId: StepId,
    count?: number,
    totals?: Partial<RunState["totals"]>,
  ) {
    const run = this.runs.get(runId);
    if (!run) return;
    const step = run.steps[stepId];
    step.status = "completed";
    if (typeof count === "number") step.count = count;
    step.endedAt = Date.now();
    if (totals) run.totals = { ...run.totals, ...totals };
    run.updatedAt = Date.now();
    console.log(`[Agent] ${stepId} complete (${step.count ?? 0})`);
  }

  stepError(runId: string, stepId: StepId, error: string) {
    const run = this.runs.get(runId);
    if (!run) return;
    const step = run.steps[stepId];
    step.status = "error";
    step.error = error;
    step.endedAt = Date.now();
    run.status = "error";
    run.error = error;
    run.updatedAt = Date.now();
    console.error(`[Agent:${runId}] Step error: ${stepId}: ${error}`);
  }
}

// Ensure singleton across Next.js dev HMR and route re-evaluations
const globalForRunRegistry = globalThis as unknown as {
  __RUN_REGISTRY__?: RunRegistry;
};

export const runRegistry =
  globalForRunRegistry.__RUN_REGISTRY__ ??
  (globalForRunRegistry.__RUN_REGISTRY__ = new RunRegistry());
