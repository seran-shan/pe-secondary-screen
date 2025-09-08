import { type NextRequest } from "next/server";
import { handleCallback } from "@vercel/queue";
import { agentGraph } from "@/server/agents/graph";
import { runRegistry } from "@/server/agents/run-registry";
import { db } from "@/server/db";
import { type GraphState } from "@/server/agents/state";

export const runtime = "nodejs";
export const maxDuration = 60; // seconds (adjust per Vercel plan)

type AgentRunPayload = {
  runId: string;
  sponsorName: string;
  sponsorId: string;
  portfolioUrl: string | null;
  mode: "append" | "update" | "replace";
  userId: string | null;
};

const workerHandler = async (message: AgentRunPayload) => {
  const { runId, sponsorName, portfolioUrl, mode, userId } = message;
  try {
    await runRegistry.startRun(runId);

    const start = Date.now();
    const state = await agentGraph.invoke({
      input: sponsorName,
      mode,
      runId,
      portfolioUrl: portfolioUrl ?? undefined,
    } as typeof GraphState.State);

    // finalize totals based on state and mark writer completion
    await runRegistry.stepComplete(
      runId,
      "writer",
      state.enriched?.length ?? 0,
      {
        portfolioUrls: state.portfolioUrls?.length ?? 0,
        extracted: state.extracted?.length ?? 0,
        normalized: state.normalized?.length ?? 0,
        enriched: state.enriched?.length ?? 0,
      },
    );
    await runRegistry.completeRun(runId);

    // Log run in DB
    const durationMs = Date.now() - start;
    await db.run.create({
      data: {
        durationMs,
        inputSponsor: sponsorName,
        portfolioUrlsCount: state.portfolioUrls?.length ?? 0,
        extractedCount: state.extracted?.length ?? 0,
        normalizedCount: state.normalized?.length ?? 0,
        enrichedCount: state.enriched?.length ?? 0,
        userId: userId,
      },
    });
  } catch (err) {
    console.error(`[Agent:${runId}] Fatal error`, err);
    await runRegistry.failRun(
      runId,
      err instanceof Error ? err.message : String(err),
    );
  }
};

const handlers = {
  "agent-run": {
    worker: workerHandler,
    default: workerHandler,
  },
} as const;

export const POST = handleCallback(handlers as any);

export async function GET(req: NextRequest) {
  return new Response("OK", { status: 200 });
}
