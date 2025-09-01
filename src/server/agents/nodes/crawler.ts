import Firecrawl from "@mendable/firecrawl-js";
import { type GraphState } from "../state";
import { runRegistry } from "@/server/agents/run-registry";
import { env } from "@/env";

export async function crawlerNode(state: typeof GraphState.State) {
  const urls = state.portfolioUrls ?? [];
  if (urls.length === 0) return state;
  const runId = state.runId;
  if (runId) runRegistry.stepStart(runId, "crawler");

  const client = new Firecrawl({ apiKey: env.FIRECRAWL_API_KEY });

  const crawled: Record<string, string> = {};
  for (const url of urls) {
    try {
      const doc = await client.scrape(url, {
        formats: ["markdown"],
        onlyMainContent: true,
      });
      const content = (doc as { markdown?: string })?.markdown;
      if (content) crawled[url] = content;
      if (runId)
        runRegistry.stepProgress(
          runId,
          "crawler",
          Object.keys(crawled).length,
          { crawled: Object.keys(crawled).length },
        );
    } catch (_) {
      // swallow per-URL errors; continue best-effort
      console.error(`Error crawling ${url}:`, _);
    }
  }

  state.crawled = { ...(state.crawled ?? {}), ...crawled };
  if (runId)
    runRegistry.stepComplete(runId, "crawler", Object.keys(crawled).length, {
      crawled: Object.keys(crawled).length,
    });
  return state;
}
