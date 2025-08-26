import { GraphState, type PortfolioCompany } from "../state";
import { db } from "@/server/db";

export async function writerNode(state: typeof GraphState.State) {
  const items = (state.normalized as PortfolioCompany[] | undefined) ?? [];
  const sponsorNameInput = state.input?.trim();
  // prefer explicit sponsorName from items if provided, else from input
  const sponsorName = (items[0]?.sponsorName?.trim() || sponsorNameInput || "").trim();
  if (!sponsorName || items.length === 0) return state;

  // Upsert sponsor by name
  const sponsor = await db.sponsor.upsert({
    where: { name: sponsorName },
    update: {},
    create: { name: sponsorName },
  });

  for (const item of items) {
    const asset = item.asset.trim();
    // Try find existing company for this sponsor + asset
    const existing = await db.portfolioCompany.findFirst({
      where: { sponsorId: sponsor.id, asset },
      select: { id: true },
    });
    const data = {
      asset,
      dateInvested: item.dateInvested ? new Date(item.dateInvested) : null,
      fsnSector: item.fsnSector ?? null,
      webpage: item.webpage ?? null,
      note: item.note ?? null,
      nextSteps: item.nextSteps ?? null,
      financials: item.financials ?? null,
      location: item.location ?? null,
      sponsorId: sponsor.id,
    } as const;

    if (existing) {
      await db.portfolioCompany.update({ where: { id: existing.id }, data });
    } else {
      await db.portfolioCompany.create({ data });
    }
  }

  return state;
}
