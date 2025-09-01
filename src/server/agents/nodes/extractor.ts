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

  const system = `You are a private equity analyst.
Extract portfolio companies held by the specified sponsor (private equity firm).
Return ONLY JSON that matches the provided schema. Do not include any extra keys.`;
  const user = `Sponsor (PE firm) name: ${state.input ?? ""}
Instructions:
- Identify the current portfolio companies for the sponsor above.
- For each company, fill: asset (name), dateInvested (ISO date if present), fsnSector (broad sector), webpage (company or portfolio page URL), note/nextSteps/financials/location when present.
- If unsure, omit the field.
- Do not include companies clearly marked as exited unless the text indicates they are still in the current portfolio.

Content to analyze (markdown excerpts):
${aggregatedMarkdown}`;

  let extracted: z.infer<typeof OutputSchema>["companies"] = [];
  try {
    const response = await model.withStructuredOutput(OutputSchema).invoke([
      { role: "system", content: system },
      { role: "user", content: user },
    ]);
    extracted = response?.companies ?? [];
  } catch {
    extracted = [];
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
