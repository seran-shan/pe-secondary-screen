import { z } from "zod";
import { GraphState, PortfolioCompanySchema } from "../state";

const ArraySchema = z.array(PortfolioCompanySchema).min(1).optional();

export async function normalizerNode(state: typeof GraphState.State) {
  const extracted = state.extracted ?? [];
  const parsed = ArraySchema.safeParse(extracted);
  const items = parsed.success ? parsed.data ?? [] : [];

  const seen = new Set<string>();
  const unique = items.filter((item) => {
    const key = `${item.asset?.toLowerCase() ?? ""}|${item.webpage ?? ""}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  state.normalized = unique;
  return state;
}


