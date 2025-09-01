import Firecrawl from "@mendable/firecrawl-js";
import { type GraphState, type PortfolioCompany } from "../state";
import { runRegistry } from "@/server/agents/run-registry";
import { env } from "@/env";

// This schema tells Firecrawl what to extract.
// It's intentionally a bit redundant with state.ts Zod schema to be explicit.
const firecrawlSchema = {
  type: "array",
  items: {
    type: "object",
    properties: {
      asset: {
        type: "string",
        description: "The name of the portfolio company.",
      },
      dateInvested: {
        type: "string",
        description:
          "The date of the investment in ISO format (e.g., YYYY-MM-DD).",
      },
      fsnSector: {
        type: "string",
        description: "The company's sector (e.g., Technology, Healthcare).",
      },
      webpage: {
        type: "string",
        description: "The company's official website URL.",
      },
      note: { type: "string", description: "Any additional notes or details." },
    },
    required: ["asset"],
  },
  description: "A list of portfolio companies.",
};

interface FirecrawlExtractResult {
  success: boolean;
  data?: {
    companies?: PortfolioCompany[];
  };
  error?: string;
}

export async function extractorNode(state: typeof GraphState.State) {
  const urls = state.portfolioUrls ?? [];
  if (urls.length === 0) return state;
  const runId = state.runId;
  if (runId) runRegistry.stepStart(runId, "extractor");

  const client = new Firecrawl({ apiKey: env.FIRECRAWL_API_KEY });

  let extracted: PortfolioCompany[] = [];

  const extractWithFirecrawl = async (enableWebSearch: boolean) => {
    const result = (await client.extract({
      urls,
      schema: {
        type: "object",
        properties: {
          companies: firecrawlSchema,
        },
        required: ["companies"],
      },
      scrapeOptions: {
        fastMode: false,
      },
      prompt:
        "From the provided webpage, extract the list of companies that are part of the current investment portfolio.",
      enableWebSearch,
    })) as FirecrawlExtractResult;

    console.log(`Firecrawl result (webSearch: ${enableWebSearch}):`, result);

    if (result.error) {
      throw new Error(result.error);
    }

    // Firecrawl returns data per-URL, so we need to aggregate
    const allCompanies = Array.isArray(result)
      ? result.flatMap((r) => r.data?.companies ?? [])
      : (result.data?.companies ?? []);

    return allCompanies;
  };

  try {
    // First attempt: try without web search (faster, more accurate)
    extracted = await extractWithFirecrawl(false);

    console.log(
      `[Extractor] Extracted ${extracted.length} companies from ${urls.length} URLs (without web search)`,
    );

    // If no companies found, retry with web search
    if (extracted.length === 0) {
      console.log(
        `[Extractor] No companies found, retrying with web search enabled...`,
      );
      extracted = await extractWithFirecrawl(true);

      console.log(
        `[Extractor] Extracted ${extracted.length} companies from ${urls.length} URLs (with web search)`,
      );
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown Firecrawl error";
    console.error(
      `[Extractor] Error extracting companies with Firecrawl:`,
      error,
    );
    if (runId) {
      runRegistry.stepError(runId, "extractor", errorMessage);
    }
    // Re-throw or handle as per desired agent behavior on failure
    throw new Error(errorMessage);
  }

  state.extracted = extracted;
  if (runId) {
    runRegistry.stepProgress(runId, "extractor", extracted.length, {
      extracted: extracted.length,
    });
    runRegistry.stepComplete(runId, "extractor", extracted.length);
  }
  return state;
}
