import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { CommentSchema } from "@/lib/schemas";
import { pusherServer } from "@/lib/pusher.server";

export const commentRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      CommentSchema.pick({ companyId: true, content: true }).extend({
        content: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const newComment = await ctx.db.comment.create({
        data: {
          content: input.content,
          companyId: input.companyId,
          authorId: ctx.session.user.id,
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
      });

      // Trigger a Pusher event for real-time updates
      void pusherServer.trigger(
        `company-${input.companyId}`,
        "new-comment",
        newComment,
      );

      return newComment;
    }),

  update: protectedProcedure
    .input(
      CommentSchema.pick({ id: true, content: true }).extend({
        content: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const comment = await ctx.db.comment.findUnique({
        where: { id: input.id },
      });

      if (comment?.authorId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only edit your own comments.",
        });
      }

      return ctx.db.comment.update({
        where: { id: input.id },
        data: { content: input.content },
      });
    }),

  delete: protectedProcedure
    .input(CommentSchema.pick({ id: true }))
    .mutation(async ({ ctx, input }) => {
      const comment = await ctx.db.comment.findUnique({
        where: { id: input.id },
      });

      if (comment?.authorId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only delete your own comments.",
        });
      }

      return ctx.db.comment.delete({
        where: { id: input.id },
      });
    }),

  getAllByCompanyId: protectedProcedure
    .input(z.object({ companyId: z.string() }))
    .query(({ ctx, input }) => {
      return ctx.db.comment.findMany({
        where: { companyId: input.companyId },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
        orderBy: {
          createdAt: "asc",
        },
      });
    }),
});
