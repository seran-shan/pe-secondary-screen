import Firecrawl from "@mendable/firecrawl-js";
import { GraphState } from "../state";
import { env } from "@/env";

export async function crawlerNode(state: typeof GraphState.State) {
  const urls = state.portfolioUrls ?? [];
  if (urls.length === 0) return state;

  const client = new Firecrawl({ apiKey: env.FIRECRAWL_API_KEY });

  const crawled: Record<string, string> = {};
  for (const url of urls) {
    try {
      const doc = await client.scrape(url, {
        formats: ["markdown"],
        onlyMainContent: true,
      });
      const content = (doc as any)?.markdown as string | undefined;
      if (content) crawled[url] = content;
    } catch (_) {
      // swallow per-URL errors; continue best-effort
      console.error(`Error crawling ${url}:`, _);
    }
  }

  state.crawled = { ...(state.crawled ?? {}), ...crawled };
  return state;
}
