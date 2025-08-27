import { type GraphState, type PortfolioCompany } from "../state";
import { db } from "@/server/db";

export async function writerNode(state: typeof GraphState.State) {
  const items = (state.normalized as PortfolioCompany[] | undefined) ?? [];
  const sponsorNameInput = state.input?.trim();
  const mode = state.mode ?? "append"; // Default to append if not specified

  // prefer explicit sponsorName from items if provided, else from input
  const sponsorName = (
    items[0]?.sponsorName?.trim() ||
    sponsorNameInput ||
    ""
  ).trim();

  if (!sponsorName || items.length === 0) return state;

  // Upsert sponsor by name
  const sponsor = await db.sponsor.upsert({
    where: { name: sponsorName },
    update: {},
    create: { name: sponsorName },
  });

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

  return state;
}

/**
 * APPEND MODE: Only add new companies, never update existing ones
 * Preserves all existing data completely
 */
async function handleAppendMode(sponsorId: string, items: PortfolioCompany[]) {
  for (const item of items) {
    const asset = item.asset.trim();

    // Check if company already exists for this sponsor
    const existing = await db.portfolioCompany.findFirst({
      where: { sponsorId, asset },
      select: { id: true },
    });

    // Only create if it doesn't exist
    if (!existing) {
      const data = {
        asset,
        dateInvested: item.dateInvested ? new Date(item.dateInvested) : null,
        fsnSector: item.fsnSector ?? null,
        webpage: item.webpage ?? null,
        note: item.note ?? null,
        nextSteps: item.nextSteps ?? null,
        financials: item.financials ?? null,
        location: item.location ?? null,
        sponsorId,
      };

      await db.portfolioCompany.create({ data });
    }
    // If it exists, skip completely (preserve existing data)
  }
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
        nextSteps: true,
        // Preserve manual fields that users might have edited
      },
    });

    if (existing) {
      // Update only basic fields, preserve manual edits
      const updateData = {
        dateInvested: item.dateInvested ? new Date(item.dateInvested) : null,
        fsnSector: item.fsnSector ?? null,
        webpage: item.webpage ?? null,
        financials: item.financials ?? null,
        location: item.location ?? null,
        // DO NOT update note and nextSteps - preserve user edits
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
        fsnSector: item.fsnSector ?? null,
        webpage: item.webpage ?? null,
        note: item.note ?? null,
        nextSteps: item.nextSteps ?? null,
        financials: item.financials ?? null,
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

  // Now create all new companies from scratch
  for (const item of items) {
    const data = {
      asset: item.asset.trim(),
      dateInvested: item.dateInvested ? new Date(item.dateInvested) : null,
      fsnSector: item.fsnSector ?? null,
      webpage: item.webpage ?? null,
      note: item.note ?? null,
      nextSteps: item.nextSteps ?? null,
      financials: item.financials ?? null,
      location: item.location ?? null,
      sponsorId,
    };

    await db.portfolioCompany.create({ data });
  }
}
