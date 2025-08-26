import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { agentGraph } from "@/server/agents/graph";
import { GraphState } from "@/server/agents/state";

export const agentRouter = createTRPCRouter({
  run: publicProcedure
    .input(z.object({ sponsorName: z.string().min(1) }))
    .mutation(async ({ input }) => {
      const state = await agentGraph.invoke({
        input: input.sponsorName,
      } as typeof GraphState.State);

      return {
        portfolioUrls: state.portfolioUrls ?? [],
        crawledCount: Object.keys(state.crawled ?? {}).length,
        extractedCount: (state.extracted as unknown[] | undefined)?.length ?? 0,
        normalizedCount: (state.normalized as unknown[] | undefined)?.length ?? 0,
        enrichedCount: (state.enriched as unknown[] | undefined)?.length ?? 0,
      };
    }),
});
