import { Annotation } from "@langchain/langgraph";
import { z } from "zod";

export const GraphState = Annotation.Root({
  input: Annotation<string | undefined>(),
  portfolioUrls: Annotation<string[] | undefined>(),
  crawled: Annotation<Record<string, string> | undefined>(),
  extracted: Annotation<unknown[] | undefined>(),
  normalized: Annotation<unknown[] | undefined>(),
  enriched: Annotation<unknown[] | undefined>(),
});

export const PortfolioCompanySchema = z.object({
  asset: z.string(),
  dateInvested: z.string().optional(),
  fsnSector: z.string().optional(),
  webpage: z.string().url().optional(),
  note: z.string().optional(),
  nextSteps: z.string().optional(),
  financials: z.string().optional(),
  location: z.string().optional(),
  sponsorName: z.string().optional(),
});

export type PortfolioCompany = z.infer<typeof PortfolioCompanySchema>;


