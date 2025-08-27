import { agentRouter } from "@/server/api/routers/agent";
import { createCallerFactory, createTRPCRouter } from "@/server/api/trpc";
import { sponsorRouter } from "@/server/api/routers/sponsor";
import { watchlistRouter } from "@/server/api/routers/watchlist";
import { alertRouter } from "@/server/api/routers/alert";
import { runRouter } from "@/server/api/routers/run";
import { commentRouter } from "@/server/api/routers/comment";
import { companyRouter } from "@/server/api/routers/company";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  agent: agentRouter,
  sponsor: sponsorRouter,
  watchlist: watchlistRouter,
  alert: alertRouter,
  run: runRouter,
  comment: commentRouter,
  company: companyRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.comment.create({
 *   companyId: "1",
 *   content: "This is a comment",
 * });
 *       ^? Comment
 */
export const createCaller = createCallerFactory(appRouter);
