import { z } from "zod";
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
        sponsorName: z.string().min(1),
        mode: z.enum(["append", "update", "replace"]).default("append"),
      }),
    )
    .mutation(async ({ input }) => {
      const run = runRegistry.createRun(input.sponsorName, input.mode);
      // Fire and forget async execution
      void (async () => {
        try {
          runRegistry.startRun(run.runId);
          const state = await agentGraph.invoke({
            input: input.sponsorName,
            mode: input.mode,
            runId: run.runId,
          } as typeof GraphState.State);

          // finalize totals based on state
          runRegistry.stepComplete(
            run.runId,
            "writer",
            state.enriched?.length ?? 0,
            {
              portfolioUrls: state.portfolioUrls?.length ?? 0,
              crawled: Object.keys(state.crawled ?? {}).length,
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
    .input(z.object({ runId: z.string().uuid() }))
    .mutation(async ({ input }) => {
      runRegistry.cancelRun(input.runId);
      return { ok: true } as const;
    }),
  checkPortfolioStatus: publicProcedure
    .input(z.object({ sponsorName: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      // Find sponsor by name
      const sponsor = await ctx.db.sponsor.findFirst({
        where: { name: input.sponsorName },
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
          // Note: LangSmith will automatically track the run through environment variables
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
        crawledCount: Object.keys(state.crawled ?? {}).length,
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
          crawledCount: result.crawledCount,
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
