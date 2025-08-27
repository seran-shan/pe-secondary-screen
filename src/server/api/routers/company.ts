import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { z } from "zod";

export const companyRouter = createTRPCRouter({
  timeline: publicProcedure
    .input(
      z.object({
        days: z.number().min(1).max(365).default(90),
      }),
    )
    .query(async ({ ctx, input }) => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - input.days);

      // Get companies created in the specified time range
      const companies = await ctx.db.portfolioCompany.findMany({
        where: {
          createdAt: {
            gte: startDate,
          },
        },
        select: {
          createdAt: true,
          sponsor: {
            select: {
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: "asc",
        },
      });

      // Group by date and create timeline data
      const timelineMap = new Map<
        string,
        { date: string; companies: number; sponsors: Set<string> }
      >();

      // Initialize all dates in range with 0 companies
      for (let i = 0; i < input.days; i++) {
        const date = new Date();
        date.setDate(date.getDate() - (input.days - 1) + i);
        const dateStr = date.toISOString().split("T")[0];
        if (dateStr) {
          timelineMap.set(dateStr, {
            date: dateStr,
            companies: 0,
            sponsors: new Set(),
          });
        }
      }

      // Add actual data
      companies.forEach((company) => {
        const dateStr = company.createdAt.toISOString().split("T")[0];
        if (dateStr) {
          const existing = timelineMap.get(dateStr);
          if (existing) {
            existing.companies += 1;
            existing.sponsors.add(company.sponsor.name);
          }
        }
      });

      // Convert to array format for chart
      return Array.from(timelineMap.values()).map(
        ({ date, companies, sponsors }) => ({
          date,
          companies,
          sponsors: sponsors.size,
        }),
      );
    }),

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
