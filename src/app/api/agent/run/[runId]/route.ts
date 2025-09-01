import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { runRegistry } from "@/server/agents/run-registry";

const RunIdSchema = z.object({
  runId: z.string().uuid("Invalid runId format"),
});

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ runId: string }> },
) {
  try {
    // Await params and validate runId with zod
    const params = await context.params;
    const result = RunIdSchema.safeParse(params);
    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid runId", details: result.error.issues },
        { status: 400 },
      );
    }

    const { runId } = result.data;
    const run = runRegistry.getRun(runId, true); // Use cache

    if (!run) {
      return NextResponse.json({ error: "Run not found" }, { status: 404 });
    }

    return NextResponse.json(run, {
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
  } catch (error) {
    console.error("[Agent API] Error getting run:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
