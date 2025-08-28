import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { agentGraph } from "@/server/agents/graph";
import { type GraphState } from "@/server/agents/state";

export const agentRouter = createTRPCRouter({
  checkPortfolioStatus: publicProcedure
    .input(z.object({ sponsorName: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      // Find sponsor by name
      const sponsor = await ctx.db.sponsor.findFirst({
        where: { name: input.sponsorName },
        include: {
          portfolio: {
            select: { id: true, createdAt: true },
            orderBy: { createdAt: "desc" },
            take: 1,
          },
          _count: {
            select: { portfolio: true },
          },
        },
      });

      if (!sponsor) {
        return {
          hasExistingData: false,
          companiesCount: 0,
          lastDiscoveryDate: null,
        };
      }

      return {
        hasExistingData: sponsor._count.portfolio > 0,
        companiesCount: sponsor._count.portfolio,
        lastDiscoveryDate: sponsor.portfolio[0]?.createdAt ?? null,
      };
    }),

  run: publicProcedure
    .input(
      z.object({
        sponsorName: z.string().min(1),
        mode: z.enum(["append", "update", "replace"]).default("append"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const start = Date.now();
      const state = await agentGraph.invoke({
        input: input.sponsorName,
        mode: input.mode,
      } as typeof GraphState.State);
      const durationMs = Date.now() - start;

      const result = {
        portfolioUrls: state.portfolioUrls ?? [],
        crawledCount: Object.keys(state.crawled ?? {}).length,
        extractedCount: state.extracted?.length ?? 0,
        normalizedCount: state.normalized?.length ?? 0,
        enrichedCount: state.enriched?.length ?? 0,
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
