import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";

export const watchlistRouter = createTRPCRouter({
  list: protectedProcedure.query(async ({ ctx }) => {
    const rows = await ctx.db.watchlist.findMany({
      where: { userId: ctx.session.user.id },
      include: { company: { include: { sponsor: true } } },
      orderBy: { createdAt: "desc" },
    });
    return rows.map((r) => ({
      id: r.company.id,
      company: r.company.asset,
      sponsor: r.company.sponsor.name,
      invested: r.company.dateInvested ?? null,
      sector: r.company.sector ?? null,
      source: r.company.webpage ?? null,
    }));
  }),

  toggle: protectedProcedure
    .input(z.object({ companyId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.watchlist.findUnique({
        where: {
          userId_companyId: {
            userId: ctx.session.user.id,
            companyId: input.companyId,
          },
        },
      });
      if (existing) {
        await ctx.db.watchlist.delete({
          where: {
            userId_companyId: {
              userId: ctx.session.user.id,
              companyId: input.companyId,
            },
          },
        });
        return { watchlisted: false };
      }
      await ctx.db.watchlist.create({
        data: { userId: ctx.session.user.id, companyId: input.companyId },
      });
      return { watchlisted: true };
    }),
});
