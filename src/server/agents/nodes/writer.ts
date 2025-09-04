import { type GraphState, type PortfolioCompany } from "../state";
import { db } from "@/server/db";
import { runRegistry } from "@/server/agents/run-registry";

export async function writerNode(state: typeof GraphState.State) {
  const items = (state.enriched as PortfolioCompany[] | undefined) ?? [];
  const sponsorNameInput = state.input?.trim();
  const mode = state.mode ?? "append"; // Default to append if not specified
  const runId = state.runId;
  if (runId) runRegistry.stepStart(runId, "writer");

  // prefer explicit sponsorName from items if provided, else from input
  const sponsorName = (
    items[0]?.sponsorName?.trim() ??
    sponsorNameInput ??
    ""
  ).trim();

  if (!sponsorName || items.length === 0) {
    if (runId) runRegistry.stepComplete(runId, "writer", 0);
    return state;
  }

  // Upsert sponsor by name
  const sponsor = await db.sponsor.upsert({
    where: { name: sponsorName },
    update: {},
    create: { name: sponsorName },
  });

  // Save discovered portfolio URL if sponsor doesn't have one
  if (state.portfolioUrls?.[0] && !sponsor.portfolioUrl) {
    await db.sponsor.update({
      where: { id: sponsor.id },
      data: { portfolioUrl: state.portfolioUrls[0] },
    });
  }

  // Handle different modes
  switch (mode) {
    case "replace":
      await handleReplaceMode(sponsor.id, items);
      break;
    case "update":
      await handleUpdateMode(sponsor.id, items);
      break;
    case "append":
    default:
      await handleAppendMode(sponsor.id, items);
      break;
  }

  if (runId) runRegistry.stepComplete(runId, "writer", items.length);
  return state;
}

/**
 * APPEND MODE: Only add new companies, never update existing ones
 * Preserves all existing data completely - uses batch operations for performance
 */
async function handleAppendMode(sponsorId: string, items: PortfolioCompany[]) {
  if (items.length === 0) return;

  // Prepare data for batch insert
  const dataToInsert = items.map((item) => ({
    asset: item.asset.trim(),
    dateInvested: item.dateInvested ? new Date(item.dateInvested) : null,
    sector: item.sector ?? null,
    webpage: item.webpage ?? null,
    note: item.note ?? null,
    location: item.location ?? null,
    sponsorId,
  }));

  // Use createMany with skipDuplicates for performance
  // This handles duplicates automatically without separate existence checks
  await db.portfolioCompany.createMany({
    data: dataToInsert,
    skipDuplicates: true, // Ignores records that would violate unique constraints
  });
}

/**
 * UPDATE MODE: Update basic fields for existing companies, preserve manual fields
 * Add new companies if discovered
 */
async function handleUpdateMode(sponsorId: string, items: PortfolioCompany[]) {
  for (const item of items) {
    const asset = item.asset.trim();

    // Check if company already exists
    const existing = await db.portfolioCompany.findFirst({
      where: { sponsorId, asset },
      select: {
        id: true,
        note: true,
      },
    });

    if (existing) {
      // Update only basic fields, preserve manual edits
      const updateData = {
        dateInvested: item.dateInvested ? new Date(item.dateInvested) : null,
        sector: item.sector ?? null,
        webpage: item.webpage ?? null,
        location: item.location ?? null,
        // DO NOT update note - preserve user edits
      };

      await db.portfolioCompany.update({
        where: { id: existing.id },
        data: updateData,
      });
    } else {
      // Create new company with all data
      const createData = {
        asset,
        dateInvested: item.dateInvested ? new Date(item.dateInvested) : null,
        sector: item.sector ?? null,
        webpage: item.webpage ?? null,
        note: item.note ?? null,
        location: item.location ?? null,
        sponsorId,
      };

      await db.portfolioCompany.create({ data: createData });
    }
  }
}

/**
 * REPLACE MODE: Delete all existing companies and create fresh ones
 * ⚠️ DESTRUCTIVE - Deletes all existing data including comments and watchlists
 */
async function handleReplaceMode(sponsorId: string, items: PortfolioCompany[]) {
  // First, delete ALL existing portfolio companies for this sponsor
  // This will cascade delete comments and watchlist entries due to foreign key constraints
  await db.portfolioCompany.deleteMany({
    where: { sponsorId },
  });

  if (items.length === 0) return;

  // Now create all new companies from scratch using a batch operation
  const dataToInsert = items.map((item) => ({
    asset: item.asset.trim(),
    dateInvested: item.dateInvested ? new Date(item.dateInvested) : null,
    sector: item.sector ?? null,
    webpage: item.webpage ?? null,
    note: item.note ?? null,
    location: item.location ?? null,
    sponsorId,
  }));

  await db.portfolioCompany.createMany({
    data: dataToInsert,
    skipDuplicates: true, // Should not be necessary after deleteMany but good practice
  });
}
