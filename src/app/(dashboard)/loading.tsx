import PageContainer from "@/components/layout/page-container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <PageContainer scrollable={true}>
      <div className="flex flex-1 flex-col space-y-8">
        {/* Hero Section Skeleton */}
        <div className="space-y-6">
          <div className="space-y-4 text-center">
            <div className="space-y-2">
              <Skeleton className="mx-auto h-12 w-2/3 md:w-1/2" />
              <Skeleton className="mx-auto h-6 w-5/6 md:w-3/4" />
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
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="group">
                <CardHeader className="pb-3">
                  <CardTitle>
                    <Skeleton className="h-6 w-3/4" />
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <Skeleton className="h-4 w-1/2" />
                  <div className="flex flex-wrap gap-1">
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-5 w-20" />
                    <Skeleton className="h-5 w-12" />
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
