import { ChartAreaInteractive } from "@/components/chart-area-interactive";
import { DataTable } from "@/components/data-table";
import { SectionCards } from "@/components/section-cards";
import PageContainer from "@/components/layout/page-container";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import data from "./data.json";

export const metadata = {
  title: "Dashboard: Analytics",
};

export default function AnalyticsPage() {
  return (
    <PageContainer scrollable={true}>
      <div className="flex flex-1 flex-col space-y-6">
        <div className="flex items-start justify-between">
          <Heading
            title="Analytics Dashboard"
            description="Comprehensive analytics overview with metrics, charts, and data tables."
          />
        </div>
        <Separator />

        {/* Section Cards */}
        <SectionCards />

        {/* Chart Section with consistent padding */}
        <div className="px-4 lg:px-6">
          <ChartAreaInteractive />
        </div>

        {/* Data Table Section */}
        <DataTable data={data} />
      </div>
    </PageContainer>
  );
}
