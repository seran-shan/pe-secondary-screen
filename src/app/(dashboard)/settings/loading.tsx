import PageContainer from "@/components/layout/page-container";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

export default function SettingsLoading() {
  return (
    <PageContainer scrollable={true}>
      <div className="flex flex-1 flex-col space-y-6">
        {/* Header Skeleton */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-4 w-96" />
          </div>
        </div>

        <Separator />

        <Skeleton className="h-24 w-full" />
      </div>
    </PageContainer>
  );
}
