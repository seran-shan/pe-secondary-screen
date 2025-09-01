import { TavilySearch } from "@langchain/tavily";
import { type GraphState } from "../state";
import { runRegistry } from "@/server/agents/run-registry";
import { env } from "@/env";

interface TavilyResponse {
  results?: Array<{ url?: string }>;
}

export async function finderNode(state: typeof GraphState.State) {
  const query = state.input?.trim();
  if (!query) return state;
  const runId = state.runId;
  if (runId) runRegistry.stepStart(runId, "finder");

  const tavily = new TavilySearch({
    tavilyApiKey: env.TAVILY_API_KEY,
    maxResults: 3,
    searchDepth: "advanced",
  });

  const resp = (await tavily.invoke({
    query: `${query} portfolio companies`,
    searchDepth: "advanced",
    topic: "general",
  })) as TavilyResponse;

  const urls =
    resp?.results && Array.isArray(resp.results)
      ? resp.results
          .map((r) => r?.url)
          .filter((u): u is string => typeof u === "string" && u.length > 0)
      : [];

  state.portfolioUrls = urls;
  if (runId) {
    runRegistry.stepProgress(runId, "finder", urls.length, {
      portfolioUrls: urls.length,
    });
    runRegistry.stepComplete(runId, "finder", urls.length);
  }
  return state;
}
