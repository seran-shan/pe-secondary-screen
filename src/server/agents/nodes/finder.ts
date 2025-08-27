import { TavilySearch } from "@langchain/tavily";
import { type GraphState } from "../state";
import { env } from "@/env";

export async function finderNode(state: typeof GraphState.State) {
  const query = state.input?.trim();
  if (!query) return state;

  const tavily = new TavilySearch({
    tavilyApiKey: env.TAVILY_API_KEY,
    maxResults: 5,
    searchDepth: "advanced",
  });

  const resp = await tavily.invoke({
    query: `${query} private equity portfolio site:com OR site:eu`,
    searchDepth: "advanced",
    topic: "general",
  });

  const urls =
    resp?.results && Array.isArray((resp).results)
      ? (resp).results
          .map((r: any) => r?.url as string | undefined)
          .filter(
            (u: unknown): u is string => typeof u === "string" && u.length > 0,
          )
      : [];

  state.portfolioUrls = urls;
  return state;
}
