import { z } from "zod";
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "@/server/api/trpc";
import { db } from "@/server/db";
import { pusherServer } from "@/lib/pusher.server";
import { enrichCompany } from "@/server/services/enrichment";

export const companyRouter = createTRPCRouter({
  getAll: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.portfolioCompany.findMany({
      include: {
        comments: {
          include: {
            author: true,
          },
        },
        sponsor: true,
      },
    });
  }),

  enrich: protectedProcedure
    .input(z.object({ companyIds: z.array(z.string()) }))
    .mutation(async ({ ctx, input }) => {
      const { companyIds } = input;
      const userId = ctx.session.user.id; // For Pusher channel

      // Fire and forget: don't await this so the mutation returns immediately
      void (async () => {
        for (const companyId of companyIds) {
          try {
            const company = await db.portfolioCompany.findUnique({
              where: { id: companyId },
              include: { sponsor: { select: { portfolioUrl: true } } },
            });

            if (!company) {
              throw new Error(`Company with id ${companyId} not found.`);
            }

            const updatedCompany = await enrichCompany(company);

            // Notify client of success
            await pusherServer.trigger(
              `user-${userId}`,
              "enrichment-complete",
              {
                companyId,
                company: updatedCompany,
              },
            );
          } catch (error) {
            // Notify client of failure
            await pusherServer.trigger(`user-${userId}`, "enrichment-error", {
              companyId,
              error: error instanceof Error ? error.message : "Unknown error",
            });
          }
        }
      })();

      return { success: true, companyIds };
    }),
});
