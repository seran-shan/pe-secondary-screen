import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/server/api/trpc";

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

  recent: publicProcedure.query(async ({ ctx }) => {
    const rows = await ctx.db.run.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
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

  stats: publicProcedure.query(async ({ ctx }) => {
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const [
      totalRuns,
      thisMonthRuns,
      lastMonthRuns,
      totalCompanies,
      totalSponsors,
      thisMonthCompanies,
    ] = await Promise.all([
      ctx.db.run.count(),
      ctx.db.run.count({ where: { createdAt: { gte: thisMonth } } }),
      ctx.db.run.count({
        where: {
          createdAt: {
            gte: lastMonth,
            lt: thisMonth,
          },
        },
      }),
      ctx.db.portfolioCompany.count(),
      ctx.db.sponsor.count(),
      ctx.db.portfolioCompany.count({
        where: { createdAt: { gte: thisMonth } },
      }),
    ]);

    const monthlyGrowth =
      lastMonthRuns > 0
        ? ((thisMonthRuns - lastMonthRuns) / lastMonthRuns) * 100
        : thisMonthRuns > 0
          ? 100
          : 0;

    return {
      totalRuns,
      totalCompanies,
      totalSponsors,
      thisMonthRuns,
      thisMonthCompanies,
      monthlyGrowth: Math.round(monthlyGrowth * 10) / 10, // Round to 1 decimal
    };
  }),
});
