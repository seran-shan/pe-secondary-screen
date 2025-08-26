import PageContainer from '@/components/layout/page-container';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import { SponsorsList } from '@/components/companies/sponsors-list';
import { db } from '@/server/db';

export const metadata = { title: 'Sponsors' };

export default async function SponsorsPage() {
  const sponsorsFromDb = await db.sponsor.findMany({
    include: { portfolio: true },
    orderBy: { name: 'asc' },
  });

  const sponsors = sponsorsFromDb.map((s) => ({
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
      <div className="flex flex-1 flex-col space-y-6">
        <div className="flex items-start justify-between">
          <Heading title="Sponsors" description="List of GPs and refresh status." />
        </div>
        <Separator />
        <SponsorsList sponsors={sponsors} />
      </div>
    </PageContainer>
  );
}


