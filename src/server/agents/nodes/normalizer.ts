import { z } from "zod";
import { type GraphState, PortfolioCompanySchema } from "../state";
import { runRegistry } from "@/server/agents/run-registry";

const ArraySchema = z.array(PortfolioCompanySchema).min(1).optional();

export async function normalizerNode(state: typeof GraphState.State) {
  const extracted = state.extracted ?? [];
  const parsed = ArraySchema.safeParse(extracted);
  const items = parsed.success ? (parsed.data ?? []) : [];
  const runId = state.runId;
  if (runId) runRegistry.stepStart(runId, "normalizer");

  const seen = new Set<string>();
  const unique = items.filter((item) => {
    const key = `${item.asset?.toLowerCase() ?? ""}|${item.webpage ?? ""}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  state.normalized = unique;
  if (runId) {
    runRegistry.stepProgress(runId, "normalizer", unique.length, {
      normalized: unique.length,
    });
    runRegistry.stepComplete(runId, "normalizer", unique.length);
  }
  return state;
}
