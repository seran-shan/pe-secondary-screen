import { z } from "zod";
import { ChatAnthropic } from "@langchain/anthropic";
import { type GraphState, PortfolioCompanySchema } from "../state";
import { runRegistry } from "@/server/agents/run-registry";
import { env } from "@/env";

const OutputSchema = z.object({
  companies: z.array(PortfolioCompanySchema),
});

export async function extractorNode(state: typeof GraphState.State) {
  const crawled = state.crawled ?? {};
  const pages = Object.entries(crawled);
  if (pages.length === 0) return state;
  const runId = state.runId;
  if (runId) runRegistry.stepStart(runId, "extractor");

  const model = new ChatAnthropic({
    apiKey: env.ANTHROPIC_API_KEY,
    model: "claude-sonnet-4-20250514",
    temperature: 0,
  });

  const aggregatedMarkdown = pages
    .map(([url, md]) => {
      // Truncate per-URL content to keep prompt within model limits
      const text = (md ?? "").toString();
      const slice = text.length > 12000 ? text.slice(0, 12000) : text;
      return `URL: ${url}\n\n${slice}`;
    })
    .join("\n\n---\n\n");

  const system = `You are a private equity analyst extracting portfolio companies from web content.

IMPORTANT: You must return a JSON object with a "companies" array, even if no companies are found.
If no companies are found, return: {"companies": []}

For each company found, extract:
- asset: Company name (required)
- dateInvested: Investment date in ISO format (optional)
- fsnSector: Broad sector like "Technology", "Healthcare", "Financial Services" (optional)
- webpage: Company website URL (optional)
- note: Any additional notes (optional)
- nextSteps: Next steps or status (optional)
- financials: Financial information (optional)
- location: Company location (optional)

Return ONLY valid JSON matching this exact schema.`;
  const user = `Sponsor (PE firm) name: ${state.input ?? ""}

Analyze the following content and extract all portfolio companies. Look for:
- Company names and descriptions
- Investment dates
- Sectors or industries
- Company websites
- Any additional details

If you find companies, return them in the companies array. If no companies are found, return {"companies": []}.

Content to analyze:
${aggregatedMarkdown}`;

  let extracted: z.infer<typeof OutputSchema>["companies"] = [];
  try {
    const response = await model.withStructuredOutput(OutputSchema).invoke([
      { role: "system", content: system },
      { role: "user", content: user },
    ]);
    extracted = response?.companies ?? [];
    console.log(
      `[Extractor] Extracted ${extracted.length} companies from ${pages.length} pages`,
    );
  } catch (error) {
    console.error(`[Extractor] Error extracting companies:`, error);

    // Fallback: try to extract with a simpler approach
    try {
      console.log(`[Extractor] Attempting fallback extraction...`);
      const fallbackResponse = await model.invoke([
        {
          role: "system",
          content:
            'Extract company names from the text. Return as JSON array: ["Company1", "Company2"]',
        },
        {
          role: "user",
          content: `Extract company names from: ${aggregatedMarkdown.substring(0, 8000)}`,
        },
      ]);

      // Try to parse the response as a simple array
      const content = fallbackResponse.content as string;
      const match = /\[.*\]/.exec(content);
      if (match) {
        const companies = JSON.parse(match[0]) as string[];
        extracted = companies.map((name: string) => ({ asset: name }));
        console.log(
          `[Extractor] Fallback extracted ${extracted.length} companies`,
        );
      }
    } catch (fallbackError) {
      console.error(`[Extractor] Fallback also failed:`, fallbackError);
      extracted = [];
    }
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
