import {
  type GraphState,
  PortfolioCompanySchema,
  type PortfolioCompany,
} from "../state";
import { runRegistry } from "@/server/agents/run-registry";

export async function normalizerNode(state: typeof GraphState.State) {
  const extracted = (state.extracted as PortfolioCompany[]) ?? [];
  const items: PortfolioCompany[] = [];
  for (const item of extracted) {
    const parsed = PortfolioCompanySchema.safeParse(item);
    if (parsed.success) {
      items.push(parsed.data);
    } else {
      console.error(`[Normalizer] Validation failed:`, parsed.error.format());
      console.error(`[Normalizer] Item:`, item);
    }
  }

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
