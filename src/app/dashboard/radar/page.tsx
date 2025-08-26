import PageContainer from "@/components/layout/page-container";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { SecondaryInteractive } from "@/components/containers/radar-interactive";
import { SectionCards } from "@/components/section-cards";
import { ChartAreaInteractive } from "@/components/chart-area-interactive";
import { CompaniesTable } from "@/components/companies/companies-table";

export const metadata = {
  title: "Exit Radar",
};

export default function SecondaryPage() {
  return (
    <PageContainer scrollable={true}>
      <div className="flex flex-1 flex-col space-y-6">
        <div className="flex items-start justify-between">
          <Heading
            title="Exit Radar"
            description="AI-assisted portfolio discovery and ingestion."
          />
        </div>
        <Separator />
        <SectionCards />
        <div className="px-4 lg:px-6">
          <ChartAreaInteractive />
        </div>
        <SecondaryInteractive />
        <CompaniesTable data={[]} />
      </div>
    </PageContainer>
  );
}
