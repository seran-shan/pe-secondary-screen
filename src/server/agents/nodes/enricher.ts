import { type GraphState, type PortfolioCompany } from "../state";
import { runRegistry } from "@/server/agents/run-registry";
import { env } from "@/env";
import Firecrawl from "@mendable/firecrawl-js";

// Constant schema; we’ll only vary "required"
const ENRICHMENT_SCHEMA = {
  type: "object",
  properties: {
    sector: {
      type: "string",
      description: "Industry/sector (e.g., Technology).",
    },
    webpage: { type: "string", description: "Official website URL." },
    description: {
      type: "string",
      description: "1–2 sentence company summary.",
    },
    location: { type: "string", description: "HQ in 'City, Country'." },
    dateInvested: { type: "string", description: "YYYY-MM-DD if available." },
    status: {
      type: "string",
      enum: ["ACTIVE", "EXITED"],
      description: "Investment status.",
    },
  },
} as const;

type EnrichmentData = Partial<{
  sector: string;
  webpage: string;
  description: string;
  location: string;
  dateInvested: string;
  status: "ACTIVE" | "EXITED";
}>;

const isBlank = (v?: string | null) => (v ?? "").trim() === "";

const dedupeUrls = (...maybe: Array<string | undefined | null | string[]>) =>
  Array.from(
    new Set(
      maybe
        .flat()
        .filter(
          (u): u is string => typeof u === "string" && u.trim().length > 0,
        ),
    ),
  );

const prefer = (current?: string | null, incoming?: string) => {
  const c = (current ?? "").trim();
  return c ? c : (incoming ?? undefined);
};

export async function enricherNode(state: typeof GraphState.State) {
  const items = (state.normalized as PortfolioCompany[] | undefined) ?? [];
  if (items.length === 0) return state;

  const runId = state.runId;
  if (runId) await runRegistry.stepStart(runId, "enricher");

  const firecrawl = new Firecrawl({ apiKey: env.FIRECRAWL_API_KEY });
  const enriched: PortfolioCompany[] = [];

  for (const item of items) {
    // Decide which fields we actually need
    const wantStatus = isBlank(item.status as string | undefined); // or set true if you always want to refresh
    const required: Array<keyof EnrichmentData> = [];
    if (isBlank(item.sector)) required.push("sector");
    if (isBlank(item.webpage)) required.push("webpage");
    if (isBlank(item.description)) required.push("description");
    if (isBlank(item.location)) required.push("location");
    if (isBlank(item.dateInvested)) required.push("dateInvested");
    if (wantStatus) required.push("status");

    const urls = dedupeUrls(
      item.webpage,
      state.portfolioUrl,
      state.portfolioUrls,
    );
    let data: EnrichmentData | undefined;

    if (urls.length && required.length) {
      const result = await firecrawl.extract({
        urls,
        schema: { ...ENRICHMENT_SCHEMA, required: required as string[] },
        scrapeOptions: { fastMode: false },
        enableWebSearch: true,
        prompt:
          `Enrich ONLY the requested fields for portfolio company "${item.asset}" (sponsor: "${state.input ?? ""}"). ` +
          `Prefer sponsor portfolio pages; otherwise use company site / press releases. Ignore similarly named companies.`,
      });

      // Normalize to array, merge first non-empty values
      type FirecrawlItem = { data?: Record<string, unknown>; error?: string };
      const results: FirecrawlItem[] = Array.isArray(result)
        ? (result as FirecrawlItem[])
        : [result as FirecrawlItem];
      const combined: Record<string, unknown> = {};
      for (const r of results) {
        if (!r || r.error) continue;
        const d = r.data;
        if (!d) continue;
        for (const k of Object.keys(d)) {
          if (combined[k] == null && d[k] != null) combined[k] = d[k];
        }
      }
      data = combined as EnrichmentData;
    }

    const next: PortfolioCompany = {
      ...item,
      sponsorName:
        item.sponsorName ??
        (typeof state.input === "string" ? state.input : undefined),
      sector: prefer(item.sector, data?.sector),
      webpage: prefer(item.webpage, data?.webpage),
      description: prefer(item.description, data?.description),
      location: prefer(item.location, data?.location),
      dateInvested: prefer(item.dateInvested, data?.dateInvested),
      status:
        data?.status === "ACTIVE" || data?.status === "EXITED"
          ? data.status
          : (item.status ?? "ACTIVE"),
    };

    enriched.push(next);
    if (runId)
      await runRegistry.stepProgress(runId, "enricher", enriched.length, {
        enriched: enriched.length,
      });
  }

  state.enriched = enriched;
  if (runId)
    await runRegistry.stepComplete(runId, "enricher", enriched.length, {
      enriched: enriched.length,
    });
  return state;
}
