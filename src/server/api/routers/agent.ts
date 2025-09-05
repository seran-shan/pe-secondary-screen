import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { agentGraph } from "@/server/agents/graph";
import { type GraphState } from "@/server/agents/state";
import { runRegistry } from "@/server/agents/run-registry";
import {
  langsmithClient,
  createRunName,
  createRunMetadata,
  configureLangSmith,
} from "@/lib/langsmith";

export const agentRouter = createTRPCRouter({
  start: publicProcedure
    .input(
      z.object({
        sponsorId: z.string().min(1),
        mode: z.enum(["append", "update", "replace"]).default("append"),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      // Get sponsor once to pass portfolioUrl to graph
      const sponsor = await ctx.db.sponsor.findUnique({
        where: { id: input.sponsorId },
        select: { id: true, name: true, portfolioUrl: true },
      });

      if (!sponsor) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Sponsor not found",
        });
      }

      const run = runRegistry.createRun(sponsor.name, input.mode);
      // Fire and forget async execution
      void (async () => {
        try {
          runRegistry.startRun(run.runId);

          const state = await agentGraph.invoke({
            input: sponsor.name,
            mode: input.mode,
            runId: run.runId,
            portfolioUrl: sponsor.portfolioUrl,
          } as typeof GraphState.State);

          // finalize totals based on state
          runRegistry.stepComplete(
            run.runId,
            "writer",
            state.enriched?.length ?? 0,
            {
              portfolioUrls: state.portfolioUrls?.length ?? 0,
              extracted: state.extracted?.length ?? 0,
              normalized: state.normalized?.length ?? 0,
              enriched: state.enriched?.length ?? 0,
            },
          );
          runRegistry.completeRun(run.runId);
        } catch (err) {
          console.error(`[Agent:${run.runId}] Fatal error`, err);
          runRegistry.failRun(
            run.runId,
            err instanceof Error ? err.message : String(err),
          );
        }
      })();

      return { runId: run.runId };
    }),

  cancel: publicProcedure
    .input(z.object({ runId: z.string().min(1) }))
    .mutation(async ({ input }) => {
      runRegistry.cancelRun(input.runId);
      return { ok: true } as const;
    }),
  checkPortfolioStatus: publicProcedure
    .input(z.object({ sponsorId: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      // Find sponsor by ID
      const sponsor = await ctx.db.sponsor.findUnique({
        where: { id: input.sponsorId },
        include: {
          portfolio: {
            select: { id: true, createdAt: true },
            orderBy: { createdAt: "desc" },
            take: 1,
          },
          _count: {
            select: { portfolio: true },
          },
        },
      });

      if (!sponsor) {
        return {
          hasExistingData: false,
          companiesCount: 0,
          lastDiscoveryDate: null,
        };
      }

      return {
        hasExistingData: sponsor._count.portfolio > 0,
        companiesCount: sponsor._count.portfolio,
        lastDiscoveryDate: sponsor.portfolio[0]?.createdAt ?? null,
      };
    }),

  run: publicProcedure
    .input(
      z.object({
        sponsorName: z.string().min(1),
        mode: z.enum(["append", "update", "replace"]).default("append"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const start = Date.now();

      // Create LangSmith run for tracking
      const runName = createRunName(input.sponsorName, input.mode);
      const metadata = createRunMetadata(input.sponsorName, input.mode);

      let langsmithRunId: string | undefined;
      if (process.env.LANGCHAIN_API_KEY) {
        try {
          await langsmithClient.createRun({
            name: runName,
            run_type: "chain",
            inputs: { sponsorName: input.sponsorName, mode: input.mode },
            extra: metadata,
          });
        } catch (error) {
          console.error("Failed to create LangSmith run:", error);
        }
      }

      // Configure LangSmith only when actually running the agent
      if (process.env.LANGCHAIN_API_KEY) {
        process.env.LANGCHAIN_CALLBACKS_BACKGROUND = "true";
        process.env.LANGCHAIN_VERBOSE = "false";
        configureLangSmith();
      }

      const state = await agentGraph.invoke({
        input: input.sponsorName,
        mode: input.mode,
      } as typeof GraphState.State);
      const durationMs = Date.now() - start;

      const result = {
        portfolioUrls: state.portfolioUrls ?? [],
        extractedCount: state.extracted?.length ?? 0,
        normalizedCount: state.normalized?.length ?? 0,
        enrichedCount: state.enriched?.length ?? 0,
      };

      // Fire-and-forget log (await to ensure consistency if desired)
      await ctx.db.run.create({
        data: {
          durationMs,
          inputSponsor: input.sponsorName,
          portfolioUrlsCount: result.portfolioUrls.length,
          extractedCount: result.extractedCount,
          normalizedCount: result.normalizedCount,
          enrichedCount: result.enrichedCount,
          userId: ctx.session?.user?.id ?? null,
        },
      });

      // Log completion to LangSmith if available
      if (process.env.LANGCHAIN_API_KEY && langsmithRunId) {
        try {
          await langsmithClient.updateRun(langsmithRunId, {
            outputs: result,
            end_time: Date.now(),
          });
        } catch (error) {
          console.error("Failed to update LangSmith run:", error);
        }
      }

      return result;
    }),
});
