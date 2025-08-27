import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "@/server/api/trpc";
import {
  normalizeSponsorName,
  isPotentialDuplicate,
  validateSponsorName,
} from "@/lib/sponsor-utils";

export const sponsorRouter = createTRPCRouter({
  listNames: publicProcedure.query(async ({ ctx }) => {
    const sponsors = await ctx.db.sponsor.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });
    return sponsors.map((s) => ({ id: s.id, name: s.name }));
  }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.sponsor.findUnique({
        where: { id: input.id },
        select: { id: true, name: true },
      });
    }),

  getByIdWithPortfolio: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const sponsor = await ctx.db.sponsor.findUnique({
        where: { id: input.id },
        include: {
          portfolio: {
            select: {
              asset: true,
              webpage: true,
              fsnSector: true,
              dateInvested: true,
            },
            orderBy: { dateInvested: "desc" },
          },
        },
      });

      if (!sponsor) {
        return null;
      }

      return {
        id: sponsor.id,
        name: sponsor.name,
        contact: sponsor.contact,
        portfolio: sponsor.portfolio.map((p) => ({
          asset: p.asset,
          webpage: p.webpage ?? undefined,
          fsnSector: p.fsnSector ?? undefined,
          dateInvested: p.dateInvested
            ? p.dateInvested.toISOString()
            : undefined,
        })),
      };
    }),

  findSimilar: publicProcedure
    .input(
      z.object({
        name: z.string().min(2).max(100),
        limit: z.number().min(1).max(10).default(5),
      }),
    )
    .query(async ({ ctx, input }) => {
      if (input.name.length < 2) {
        return [];
      }

      // Get all sponsors for fuzzy matching
      const allSponsors = await ctx.db.sponsor.findMany({
        select: { id: true, name: true, contact: true },
        orderBy: { name: "asc" },
      });

      // Find similar sponsors using our utility functions
      const similarSponsors = allSponsors.filter(
        (sponsor) => isPotentialDuplicate(input.name, sponsor.name, 0.6), // Lower threshold for suggestions
      );

      // Sort by similarity and limit results
      return similarSponsors.slice(0, input.limit).map((sponsor) => ({
        id: sponsor.id,
        name: sponsor.name,
        contact: sponsor.contact,
      }));
    }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(2).max(100),
        contact: z.string().email().optional().or(z.literal("")),
        notes: z.string().max(500).optional(),
        forceCreate: z.boolean().default(false),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Validate sponsor name
      const validation = validateSponsorName(input.name);
      if (!validation.isValid) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: validation.errors.join(", "),
        });
      }

      const trimmedName = input.name.trim();
      const normalizedName = normalizeSponsorName(trimmedName);

      // Check for duplicates unless forced
      if (!input.forceCreate) {
        const existingSponsors = await ctx.db.sponsor.findMany({
          select: { id: true, name: true },
        });

        const duplicates = existingSponsors.filter(
          (sponsor) => isPotentialDuplicate(trimmedName, sponsor.name, 0.8), // Higher threshold for blocking
        );

        if (duplicates.length > 0) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Similar sponsors found",
            cause: duplicates,
          });
        }
      }

      // Create the sponsor
      const newSponsor = await ctx.db.sponsor.create({
        data: {
          name: trimmedName,
          contact: input.contact || null,
          // Note: We'll add normalizedName and notes when we update the schema
        },
        select: {
          id: true,
          name: true,
          contact: true,
          createdAt: true,
        },
      });

      return newSponsor;
    }),

  getAll: publicProcedure
    .input(
      z.object({
        search: z.string().optional(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      }),
    )
    .query(async ({ ctx, input }) => {
      const whereClause = input.search
        ? {
            name: {
              contains: input.search,
              mode: "insensitive" as const,
            },
          }
        : {};

      const [sponsors, total] = await Promise.all([
        ctx.db.sponsor.findMany({
          where: whereClause,
          select: {
            id: true,
            name: true,
            contact: true,
            createdAt: true,
            _count: {
              select: {
                portfolio: true,
              },
            },
          },
          orderBy: { name: "asc" },
          take: input.limit,
          skip: input.offset,
        }),
        ctx.db.sponsor.count({ where: whereClause }),
      ]);

      return {
        sponsors: sponsors.map((sponsor) => ({
          ...sponsor,
          portfolioCount: sponsor._count.portfolio,
        })),
        total,
        hasMore: input.offset + input.limit < total,
      };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Check if sponsor exists
      const sponsor = await ctx.db.sponsor.findUnique({
        where: { id: input.id },
        include: {
          _count: {
            select: {
              portfolio: true,
            },
          },
        },
      });

      if (!sponsor) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Sponsor not found",
        });
      }

      // Check if sponsor has portfolio companies
      if (sponsor._count.portfolio > 0) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: `Cannot delete sponsor with ${sponsor._count.portfolio} portfolio companies. Please remove or transfer all portfolio companies first.`,
        });
      }

      // Delete the sponsor
      await ctx.db.sponsor.delete({
        where: { id: input.id },
      });

      return { success: true, deletedId: input.id };
    }),
});
