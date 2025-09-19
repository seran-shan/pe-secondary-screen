import PageContainer from "@/components/layout/page-container";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

export default function HistoryLoading() {
  const tableRows = Array.from({ length: 8 });
  const tableCells = Array.from({ length: 8 });

  return (
    <PageContainer scrollable={true}>
      <div className="flex flex-1 flex-col space-y-6">
        {/* Header Skeleton */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-80" />
          </div>
        </div>

        <Separator />

        {/* Table Skeleton */}
        <div className="overflow-hidden rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                {tableCells.map((_, i) => (
                  <th key={i} className="px-3 py-2 text-left font-medium">
                    <Skeleton className="h-5 w-24" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableRows.map((_, i) => (
                <tr key={i} className="border-t">
                  {tableCells.map((_, j) => (
                    <td key={j} className="px-3 py-2">
                      <Skeleton className="h-5 w-full" />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </PageContainer>
  );
}
