import { type NextRequest, NextResponse } from "next/server";
import { agentGraph } from "@/server/agents/graph";
import { runRegistry } from "@/server/agents/run-registry";
import { db } from "@/server/db";
import { type GraphState } from "@/server/agents/state";
import { verifyRequest } from "@/lib/qstash";

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

async function handler(payload: AgentRunPayload) {
  const { runId, sponsorName, portfolioUrl, mode, userId } = payload;
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
    await runRegistry.stepComplete(runId, "writer", state.added ?? 0, {
      portfolioUrls: state.portfolioUrls?.length ?? 0,
      extracted: state.extracted?.length ?? 0,
      normalized: state.normalized?.length ?? 0,
      added: state.added ?? 0,
    });
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
        userId: userId,
      },
    });
    return new NextResponse("OK", { status: 200 });
  } catch (err) {
    console.error(`[Agent:${runId}] Fatal error`, err);
    await runRegistry.failRun(
      runId,
      err instanceof Error ? err.message : String(err),
    );
    return new NextResponse(err instanceof Error ? err.message : "Error", {
      status: 500,
    });
  }
}

export const POST = verifyRequest(handler);

export async function GET(_req: NextRequest) {
  return new NextResponse("OK", { status: 200 });
}
