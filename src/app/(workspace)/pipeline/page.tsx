import PageContainer from "@/components/layout/page-container";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { PipelineStepper } from "@/components/pipeline/pipeline-stepper";

export const metadata = { title: "Pipeline" };

export default function PipelinePage() {
  // Placeholder with empty metrics until run data is provided
  const empty = {
    portfolioUrls: [],
    crawledCount: 0,
    extractedCount: 0,
    normalizedCount: 0,
    enrichedCount: 0,
  } as any;
  return (
    <PageContainer scrollable={true}>
      <div className="flex flex-1 flex-col space-y-6">
        <div className="flex items-start justify-between">
          <Heading
            title="Pipeline"
            description="Finder → Writer with progress and metrics."
          />
        </div>
        <Separator />
        <PipelineStepper data={empty} />
      </div>
    </PageContainer>
  );
}
