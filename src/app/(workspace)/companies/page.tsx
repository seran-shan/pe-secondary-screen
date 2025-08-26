import PageContainer from '@/components/layout/page-container';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import { CompaniesDataTable, companySchema } from '@/components/companies/companies-data-table';
import { db } from '@/server/db';

export const metadata = { title: 'Companies' };

export default async function CompaniesPage() {
  const companies = await db.portfolioCompany.findMany({
    include: { sponsor: true },
    orderBy: { createdAt: 'desc' },
  });

  const rows = companies.map((c, idx) => ({
    id: idx + 1,
    company: c.asset,
    sponsor: c.sponsor.name,
    invested: c.dateInvested ? c.dateInvested.toISOString().slice(0, 10) : undefined,
    sector: c.fsnSector ?? undefined,
    source: c.webpage ?? undefined,
    status: 'Active',
  } satisfies typeof companySchema._type));
  return (
    <PageContainer scrollable={true}>
      <div className="flex flex-1 flex-col space-y-6">
        <div className="flex items-start justify-between">
          <Heading title="Companies" description="Faceted table of screened portfolio companies." />
        </div>
        <Separator />
        <CompaniesDataTable data={rows} />
      </div>
    </PageContainer>
  );
}


