import PageContainer from "@/components/layout/page-container";
import { Separator } from "@/components/ui/separator";
import { SponsorsList } from "@/components/companies/sponsors-list";
import {
  SponsorsHeader,
  SponsorsProvider,
  type Sponsor,
} from "@/components/sponsors";
import { db } from "@/server/db";

export const metadata = { title: "Sponsors" };

export default async function SponsorsPage() {
  const sponsorsFromDb = await db.sponsor.findMany({
    include: { portfolio: true },
    orderBy: { name: "asc" },
  });

  const sponsors: Sponsor[] = sponsorsFromDb.map((s) => ({
    id: s.id,
    name: s.name,
    contact: s.contact,
    portfolio: s.portfolio.map((p) => ({
      asset: p.asset,
      webpage: p.webpage ?? undefined,
      fsnSector: p.fsnSector ?? undefined,
      dateInvested: p.dateInvested ? p.dateInvested.toISOString() : undefined,
    })),
  }));

  return (
    <PageContainer scrollable={true}>
      <SponsorsProvider initialSponsors={sponsors}>
        <div className="flex flex-1 flex-col space-y-6">
          <SponsorsHeader
            title="Sponsors"
            description="Manage your portfolio sponsors and their investment details."
          />
          <Separator />
          <SponsorsList />
        </div>
      </SponsorsProvider>
    </PageContainer>
  );
}
