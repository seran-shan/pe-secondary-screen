import PageContainer from "@/components/layout/page-container";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function DashboardLoading() {
  const sponsorCards = Array.from({ length: 6 });

  return (
    <PageContainer scrollable={true}>
      <div className="flex flex-1 flex-col space-y-8">
        {/* Hero Skeleton */}
        <div className="space-y-6">
          <div className="space-y-4 text-center">
            <div className="space-y-2">
              <Skeleton className="mx-auto h-12 w-3/4" />
              <Skeleton className="mx-auto h-6 w-1/2" />
            </div>
          </div>
        </div>

        <Separator />

        {/* Sponsors Section Skeleton */}
        <div className="flex flex-1 flex-col space-y-6">
          <div className="flex justify-end">
            <Skeleton className="h-10 w-32" />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sponsorCards.map((_, i) => (
              <Card key={i}>
                <CardHeader className="pb-3">
                  <CardTitle>
                    <Skeleton className="h-5 w-3/5" />
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <Skeleton className="h-4 w-1/2" />
                  <div className="flex flex-wrap gap-1">
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-5 w-20" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
