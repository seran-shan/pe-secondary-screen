import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";

export const runRouter = createTRPCRouter({
  list: protectedProcedure.query(async ({ ctx }) => {
    const rows = await ctx.db.run.findMany({
      where: { userId: ctx.session.user.id },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    return rows.map((r) => ({
      id: r.id,
      createdAt: r.createdAt,
      durationMs: r.durationMs,
      inputSponsor: r.inputSponsor,
      portfolioUrlsCount: r.portfolioUrlsCount,
      crawledCount: r.crawledCount,
      extractedCount: r.extractedCount,
      normalizedCount: r.normalizedCount,
      enrichedCount: r.enrichedCount,
    }));
  }),
});
