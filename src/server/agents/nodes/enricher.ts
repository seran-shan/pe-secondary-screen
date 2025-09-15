import { type GraphState, type PortfolioCompany } from "../state";
import { runRegistry } from "@/server/agents/run-registry";
import { env } from "@/env";
import Firecrawl from "@mendable/firecrawl-js";
import { promises as fs } from "fs";
import path from "path";

const logToFile = async (message: string | object) => {
  const logFilePath = path.join(process.cwd(), "enricher.log");
  const timestamp = new Date().toISOString();
  const logMessage =
    typeof message === "string" ? message : JSON.stringify(message, null, 2);
  await fs.appendFile(logFilePath, `${timestamp}: ${logMessage}\n`);
};

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
  await logToFile("Enricher node started.");
  const items = (state.normalized as PortfolioCompany[] | undefined) ?? [];
  if (items.length === 0) {
    await logToFile("No items to enrich. Exiting.");
    return state;
  }

  const runId = state.runId;
  if (runId) await runRegistry.stepStart(runId, "enricher");

  const firecrawl = new Firecrawl({ apiKey: env.FIRECRAWL_API_KEY });
  const enriched: PortfolioCompany[] = [];

  for (const item of items) {
    await logToFile(`Processing item: ${item.asset}`);
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
    await logToFile({ message: "URLs for extraction", urls });
    await logToFile({ message: "Required fields", required });

    if (urls.length && required.length) {
      try {
        const result = await firecrawl.extract({
          urls,
          schema: { ...ENRICHMENT_SCHEMA, required: required as string[] },
          scrapeOptions: { fastMode: false },
          enableWebSearch: true,
          prompt:
            `Enrich ONLY the requested fields for portfolio company "${item.asset}" (sponsor: "${state.input ?? ""}"). ` +
            `Prefer sponsor portfolio pages; otherwise use company site / press releases. Ignore similarly named companies.`,
        });
        await logToFile({ message: "Firecrawl result", result });

        type FirecrawlResult = {
          success?: boolean;
          data?: EnrichmentData;
          error?: string;
        };
        const firstResult = (
          (Array.isArray(result) ? result : [result]) as FirecrawlResult[]
        ).find((r) => r?.success && r.data);
        data = firstResult?.data;

        await logToFile({ message: "Combined data", data });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        await logToFile({
          message: `Error processing item: ${item.asset}`,
          error: errorMessage,
        });
        if (runId) {
          await runRegistry.stepError(runId, "enricher", errorMessage);
        }
        // We can choose to continue to the next item or re-throw
        // For now, let's continue
      }
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
    await logToFile({ message: "Enriched item", next });

    enriched.push(next);
    if (runId)
      await runRegistry.stepProgress(runId, "enricher", enriched.length, {
        enriched: enriched.length,
      });
  }

  state.enriched = enriched;
  await logToFile("Enricher node finished.");
  if (runId)
    await runRegistry.stepComplete(runId, "enricher", enriched.length, {
      enriched: enriched.length,
    });
  return state;
}
