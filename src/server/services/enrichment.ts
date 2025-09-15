import { db } from "@/server/db";
import Firecrawl from "@mendable/firecrawl-js";
import { env } from "@/env";
import type { Prisma } from "@prisma/client";
import { promises as fs } from "fs";
import path from "path";

const logToFile = async (message: string | object) => {
  const logFilePath = path.join(process.cwd(), "enricher.log");
  const timestamp = new Date().toISOString();
  const logMessage =
    typeof message === "string" ? message : JSON.stringify(message, null, 2);
  await fs.appendFile(logFilePath, `${timestamp}: ${logMessage}\n`);
};

// This is the auto-generated, type-safe way to define our input
type CompanyForEnrichment = Prisma.PortfolioCompanyGetPayload<{
  include: { sponsor: { select: { portfolioUrl: true } } };
}>;

// --- Enrichment Logic (extracted from enricher.ts) ---

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

export async function enrichCompany(company: CompanyForEnrichment) {
  await logToFile(`Enrichment started for company: ${company.asset}`);
  const firecrawl = new Firecrawl({ apiKey: env.FIRECRAWL_API_KEY });

  const required: Array<keyof EnrichmentData> = [];
  if (isBlank(company.sector)) required.push("sector");
  if (isBlank(company.webpage)) required.push("webpage");
  if (isBlank(company.description)) required.push("description");
  if (isBlank(company.location)) required.push("location");
  if (!company.dateInvested) required.push("dateInvested");
  required.push("status"); // Always re-check status

  const urls = [
    ...new Set(
      [company.webpage, company.sponsor.portfolioUrl].filter(
        Boolean,
      ) as string[],
    ),
  ];
  await logToFile({
    message: "URLs for extraction",
    urls,
    required,
  });

  let data: EnrichmentData | undefined;

  if (urls.length > 0 && required.length > 0) {
    try {
      const result = await firecrawl.extract({
        urls,
        schema: { ...ENRICHMENT_SCHEMA, required: required as string[] },
        scrapeOptions: { fastMode: false },
        enableWebSearch: true,
        prompt: `Enrich ONLY the requested fields for portfolio company "${company.asset}". Prefer sponsor portfolio pages; otherwise use company site / press releases. Ignore similarly named companies.`,
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
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      await logToFile({
        message: `Error during Firecrawl extraction for ${company.asset}`,
        error: errorMessage,
      });
      // Re-throw the error to be caught by the tRPC mutation
      throw error;
    }
  }

  // Use a helper to prefer existing data over blank incoming data
  const prefer = (current?: string | null, incoming?: string) => {
    const incomingTrimmed = (incoming ?? "").trim();
    return incomingTrimmed ? incoming : current;
  };
  const preferDate = (current?: Date | null, incoming?: string) =>
    current ?? (incoming ? new Date(incoming) : null);

  const enrichedData = {
    sector: prefer(company.sector, data?.sector),
    webpage: prefer(company.webpage, data?.webpage),
    description: prefer(company.description, data?.description),
    location: prefer(company.location, data?.location),
    dateInvested: preferDate(company.dateInvested, data?.dateInvested),
    status: data?.status ?? company.status,
  };

  await logToFile({
    message: `Enriched data for ${company.asset}`,
    data: enrichedData,
  });

  return db.portfolioCompany.update({
    where: { id: company.id },
    data: enrichedData,
  });
}
