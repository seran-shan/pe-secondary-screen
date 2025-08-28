import { type GraphState, type PortfolioCompany } from "../state";
import { TavilySearch } from "@langchain/tavily";
import { env } from "@/env";

interface TavilyResponse {
  results?: Array<{ url?: string }>;
}

export async function enricherNode(state: typeof GraphState.State) {
  const items = (state.normalized as PortfolioCompany[] | undefined) ?? [];
  if (items.length === 0) return state;

  const tavily = new TavilySearch({
    tavilyApiKey: env.TAVILY_API_KEY,
    maxResults: 3,
    searchDepth: "basic",
  });

  const enriched: PortfolioCompany[] = [];
  for (const item of items) {
    let webpage = item.webpage;
    if (!webpage) {
      const resp = (await tavily.invoke({
        query: `${item.asset} official website`,
        searchDepth: "basic",
        topic: "general",
      })) as TavilyResponse;
      const first = resp?.results?.[0]?.url;
      if (first) webpage = first;
    }

    enriched.push({ ...item, webpage });
  }

  state.enriched = enriched;
  return state;
}
