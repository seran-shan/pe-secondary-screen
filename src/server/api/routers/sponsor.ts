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
import { SponsorSchema } from "@/lib/schemas";

export const sponsorRouter = createTRPCRouter({
  listNames: publicProcedure.query(async ({ ctx }) => {
    const sponsors = await ctx.db.sponsor.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });
    return sponsors.map((s) => ({ id: s.id, name: s.name }));
  }),

  getById: publicProcedure
    .input(SponsorSchema.pick({ id: true }))
    .query(async ({ ctx, input }) => {
      return ctx.db.sponsor.findUnique({
        where: { id: input.id },
        select: { id: true, name: true },
      });
    }),

  getByIdWithPortfolio: publicProcedure
    .input(SponsorSchema.pick({ id: true }))
    .query(async ({ ctx, input }) => {
      const sponsor = await ctx.db.sponsor.findUnique({
        where: { id: input.id },
        include: {
          portfolio: {
            select: {
              asset: true,
              webpage: true,
              sector: true,
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
        portfolioUrl: sponsor.portfolioUrl,
        portfolio: sponsor.portfolio.map((p) => ({
          asset: p.asset,
          webpage: p.webpage ?? undefined,
          sector: p.sector ?? undefined,
          dateInvested: p.dateInvested
            ? p.dateInvested.toISOString()
            : undefined,
        })),
      };
    }),

  findSimilar: publicProcedure
    .input(
      SponsorSchema.pick({ name: true }).extend({
        limit: z.number().min(1).max(10).default(5),
      }),
    )
    .query(async ({ ctx, input }) => {
      if (input.name.length < 2) {
        return [];
      }

      // Narrow candidate set in DB first to avoid scanning full table
      const candidates = await ctx.db.sponsor.findMany({
        where: {
          name: {
            contains: input.name.slice(0, 16),
            mode: "insensitive",
          },
        },
        select: { id: true, name: true, contact: true },
        orderBy: { name: "asc" },
        take: input.limit * 6, // fetch a small superset, then fuzzy filter
      });

      // Find similar sponsors using our utility functions
      const similarSponsors = candidates.filter(
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
      SponsorSchema.pick({
        name: true,
        contact: true,
        portfolioUrl: true,
      }).extend({
        name: z.string().min(2).max(100),
        contact: z.string().email().optional().or(z.literal("")),
        portfolioUrl: z.string().url().max(512).optional().or(z.literal("")),
        description: z.string().max(500).optional(),
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
          (sponsor) => isPotentialDuplicate(normalizedName, sponsor.name, 0.8), // Higher threshold for blocking
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
          contact: input.contact ?? null,
          portfolioUrl: input.portfolioUrl ?? null,
        },
        select: {
          id: true,
          name: true,
          contact: true,
          portfolioUrl: true,
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
          include: {
            portfolio: {
              include: {
                sponsor: true,
                comments: {
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
                },
              },
              orderBy: { dateInvested: "desc" },
            },
          },
          orderBy: { name: "asc" },
          take: input.limit,
          skip: input.offset,
        }),
        ctx.db.sponsor.count({ where: whereClause }),
      ]);

      return {
        sponsors,
        total,
        hasMore: input.offset + input.limit < total,
      };
    }),

  delete: protectedProcedure
    .input(SponsorSchema.pick({ id: true }))
    .mutation(async ({ ctx, input }) => {
      // Check if sponsor exists
      const sponsor = await ctx.db.sponsor.findUnique({
        where: { id: input.id },
        select: { id: true }, // Select only ID, no need for counts anymore
      });

      if (!sponsor) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Sponsor not found",
        });
      }

      // Perform a transaction to delete dependents in FK-safe order, then sponsor
      await ctx.db.$transaction(async (prisma) => {
        // Collect all portfolio company IDs for this sponsor
        const companies = await prisma.portfolioCompany.findMany({
          where: { sponsorId: input.id },
          select: { id: true },
        });
        const companyIds = companies.map((c) => c.id);

        if (companyIds.length > 0) {
          // Delete dependents first to satisfy FK constraints
          await prisma.comment.deleteMany({
            where: { companyId: { in: companyIds } },
          });
          // Now delete portfolio companies
          await prisma.portfolioCompany.deleteMany({
            where: { id: { in: companyIds } },
          });
        }

        // Finally delete sponsor
        await prisma.sponsor.delete({ where: { id: input.id } });
      });

      return { success: true, deletedId: input.id };
    }),
});
