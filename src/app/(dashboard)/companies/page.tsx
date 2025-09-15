"use client";

import PageContainer from "@/components/layout/page-container";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { CompaniesDataTable } from "@/components/companies/companies-data-table";
import { CompaniesProvider } from "@/components/companies/companies-provider";
import { api } from "@/trpc/react";

function CompaniesPageContent() {
  const { data: companies, isLoading } = api.company.getAll.useQuery();

  if (isLoading) {
    return (
      <PageContainer scrollable={true}>
        <div className="flex flex-1 flex-col space-y-6">
          <div className="flex items-start justify-between">
            <Heading
              title="Companies"
              description="Faceted table of screened portfolio companies."
            />
          </div>
          <Separator />
          <div className="flex h-32 items-center justify-center">
            <p className="text-muted-foreground">Loading companies...</p>
          </div>
        </div>
      </PageContainer>
    );
  }
  return (
    <PageContainer scrollable={true}>
      <div className="flex flex-1 flex-col space-y-6">
        <div className="flex items-start justify-between">
          <Heading
            title="Companies"
            description="Faceted table of screened portfolio companies."
          />
        </div>
        <Separator />
        <CompaniesDataTable data={companies ?? []} />
      </div>
    </PageContainer>
  );
}

export default function CompaniesPage() {
  return (
    <CompaniesProvider>
      <CompaniesPageContent />
    </CompaniesProvider>
  );
}
