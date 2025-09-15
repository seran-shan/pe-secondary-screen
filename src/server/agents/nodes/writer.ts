import { type GraphState, type PortfolioCompany } from "../state";
import { db } from "@/server/db";
import { runRegistry } from "@/server/agents/run-registry";
import type { CompanyStatus } from "@prisma/client";

export async function writerNode(state: typeof GraphState.State) {
  const items = (state.normalized as PortfolioCompany[] | undefined) ?? [];
  const sponsorNameInput = state.input?.trim();
  const mode = state.mode ?? "append"; // Default to append if not specified
  const runId = state.runId;
  if (runId) await runRegistry.stepStart(runId, "writer");

  // prefer explicit sponsorName from items if provided, else from input
  const sponsorName = (
    items[0]?.sponsorName?.trim() ??
    sponsorNameInput ??
    ""
  ).trim();

  if (!sponsorName || items.length === 0) {
    if (runId) await runRegistry.stepComplete(runId, "writer", 0);
    return state;
  }

  const portfolioUrl = state.portfolioUrls?.[0];
  const sponsorExists = await db.sponsor.findUnique({
    where: { name: sponsorName },
    select: { id: true },
  });
  if (!sponsorExists && !portfolioUrl) {
    throw new Error(
      `Cannot create sponsor "${sponsorName}" because no portfolio URL was found by the finder.`,
    );
  }

  // Upsert sponsor by name
  const sponsor = await db.sponsor.upsert({
    where: { name: sponsorName },
    update: {},
    create: {
      name: sponsorName,
      portfolioUrl: portfolioUrl!, // Checked for existence above
    },
  });

  let addedCount = 0;
  // Handle different modes
  switch (mode) {
    case "replace":
      addedCount = await handleReplaceMode(sponsor.id, items);
      break;
    case "update":
      addedCount = await handleUpdateMode(sponsor.id, items);
      break;
    case "append":
    default:
      addedCount = await handleAppendMode(sponsor.id, items);
      break;
  }

  if (runId) await runRegistry.stepComplete(runId, "writer", addedCount);
  return { ...state, added: addedCount };
}

/**
 * APPEND MODE: Only add new companies, never update existing ones
 * Preserves all existing data completely - uses batch operations for performance
 */
async function handleAppendMode(
  sponsorId: string,
  items: PortfolioCompany[],
): Promise<number> {
  if (items.length === 0) return 0;

  // Prepare data for batch insert
  const dataToInsert = items.map((item) => ({
    asset: item.asset.trim(),
    dateInvested: item.dateInvested ? new Date(item.dateInvested) : null,
    sector: item.sector ?? null,
    webpage: item.webpage ?? null,
    status: "ACTIVE" as CompanyStatus, // Default new companies to ACTIVE
    sponsorId,
  }));

  // Use createMany with skipDuplicates for performance
  // This handles duplicates automatically without separate existence checks
  const result = await db.portfolioCompany.createMany({
    data: dataToInsert,
    skipDuplicates: true, // Ignores records that would violate unique constraints
  });
  return result.count;
}

/**
 * UPDATE MODE: Update basic fields for existing companies, preserve manual fields
 * Add new companies if discovered
 */
async function handleUpdateMode(
  sponsorId: string,
  items: PortfolioCompany[],
): Promise<number> {
  let addedCount = 0;
  for (const item of items) {
    const asset = item.asset.trim();

    // Check if company already exists
    const existing = await db.portfolioCompany.findFirst({
      where: { sponsorId, asset },
      select: {
        id: true,
      },
    });

    if (existing) {
      // Update only basic fields, preserve manual edits
      const updateData = {
        dateInvested: item.dateInvested ? new Date(item.dateInvested) : null,
        sector: item.sector ?? null,
        webpage: item.webpage ?? null,
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
        status: "ACTIVE" as CompanyStatus, // Default new companies to ACTIVE
        sponsorId,
      };

      await db.portfolioCompany.create({ data: createData });
      addedCount++;
    }
  }
  return addedCount;
}

/**
 * REPLACE MODE: Delete all existing companies and create fresh ones
 */
async function handleReplaceMode(
  sponsorId: string,
  items: PortfolioCompany[],
): Promise<number> {
  // First, delete ALL existing portfolio companies for this sponsor
  // This will cascade delete comments due to foreign key constraints
  await db.portfolioCompany.deleteMany({
    where: { sponsorId },
  });

  if (items.length === 0) return 0;

  // Now create all new companies from scratch using a batch operation
  const dataToInsert = items.map((item) => ({
    asset: item.asset.trim(),
    dateInvested: item.dateInvested ? new Date(item.dateInvested) : null,
    sector: item.sector ?? null,
    webpage: item.webpage ?? null,
    status: "ACTIVE" as CompanyStatus, // Default new companies to ACTIVE
    sponsorId,
  }));

  const result = await db.portfolioCompany.createMany({
    data: dataToInsert,
    skipDuplicates: true, // Should not be necessary after deleteMany but good practice
  });
  return result.count;
}
