import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";

export const sponsorRouter = createTRPCRouter({
  listNames: publicProcedure.query(async ({ ctx }) => {
    const sponsors = await ctx.db.sponsor.findMany({
      select: { name: true },
      orderBy: { name: "asc" },
    });
    return sponsors.map((s) => ({ name: s.name }));
  }),
});



