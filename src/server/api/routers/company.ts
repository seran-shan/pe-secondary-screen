import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";

export const companyRouter = createTRPCRouter({
  getAll: publicProcedure.query(async ({ ctx }) => {
    const companies = await ctx.db.portfolioCompany.findMany({
      include: {
        sponsor: true,
        comments: {
          include: {
            author: true,
          },
        },
        watchlistedBy: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return companies.map((c, idx) => ({
      id: idx + 1,
      company: c.asset,
      sponsor: c.sponsor.name,
      invested: c.dateInvested
        ? c.dateInvested.toISOString().slice(0, 10)
        : undefined,
      sector: c.fsnSector ?? undefined,
      source: c.webpage ?? undefined,
      status: "Active" as const, // TODO: Get from DB
      location: c.location ?? undefined,
      financials: c.financials ?? undefined,
      nextSteps: c.nextSteps ?? undefined,
      note: c.note ?? undefined,
      comments: c.comments.map((comment) => ({
        id: comment.id,
        content: comment.content,
        author: {
          id: comment.author.id,
          name: comment.author.name,
          image: comment.author.image,
        },
        createdAt: comment.createdAt.toISOString(),
      })),
      watchersCount: c.watchlistedBy.length,
      isWatched: false, // TODO: Check if current user is watching
    }));
  }),
});