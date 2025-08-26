import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { agentGraph } from "@/server/agents/graph";
import { GraphState } from "@/server/agents/state";

export const agentRouter = createTRPCRouter({
  run: publicProcedure
    .input(z.object({ sponsorName: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const start = Date.now();
      const state = await agentGraph.invoke({
        input: input.sponsorName,
      } as typeof GraphState.State);
      const durationMs = Date.now() - start;

      const result = {
        portfolioUrls: state.portfolioUrls ?? [],
        crawledCount: Object.keys(state.crawled ?? {}).length,
        extractedCount: (state.extracted as unknown[] | undefined)?.length ?? 0,
        normalizedCount:
          (state.normalized as unknown[] | undefined)?.length ?? 0,
        enrichedCount: (state.enriched as unknown[] | undefined)?.length ?? 0,
      };

      // Fire-and-forget log (await to ensure consistency if desired)
      await ctx.db.run.create({
        data: {
          durationMs,
          inputSponsor: input.sponsorName,
          portfolioUrlsCount: result.portfolioUrls.length,
          crawledCount: result.crawledCount,
          extractedCount: result.extractedCount,
          normalizedCount: result.normalizedCount,
          enrichedCount: result.enrichedCount,
          userId: ctx.session?.user?.id ?? null,
        },
      });

      return result;
    }),
});
