import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";

export const alertRouter = createTRPCRouter({
  list: protectedProcedure.query(async ({ ctx }) => {
    const rows = await ctx.db.alert.findMany({
      where: { userId: ctx.session.user.id },
      orderBy: { createdAt: "desc" },
      include: { company: { select: { asset: true } } },
    });
    return rows.map((a) => ({
      id: a.id,
      type: a.type,
      message: a.message,
      createdAt: a.createdAt,
      readAt: a.readAt,
      company: a.company?.asset ?? null,
    }));
  }),
});
