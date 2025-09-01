import PageContainer from "@/components/layout/page-container";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { api } from "@/trpc/server";

export const metadata = { title: "History" };

export default async function HistoryPage() {
  const runs = await api.run.list();
  return (
    <PageContainer scrollable={true}>
      <div className="flex flex-1 flex-col space-y-6">
        <div className="flex items-start justify-between">
          <Heading title="History" description="Run history and snapshots." />
        </div>
        <Separator />
        <div className="overflow-hidden rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="px-3 py-2 text-left font-medium">When</th>
                <th className="px-3 py-2 text-left font-medium">Sponsor</th>
                <th className="px-3 py-2 text-left font-medium">Duration</th>
                <th className="px-3 py-2 text-left font-medium">URLs</th>
                <th className="px-3 py-2 text-left font-medium">Crawled</th>
                <th className="px-3 py-2 text-left font-medium">Extracted</th>
                <th className="px-3 py-2 text-left font-medium">Normalized</th>
                <th className="px-3 py-2 text-left font-medium">Enriched</th>
              </tr>
            </thead>
            <tbody>
              {runs.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="px-3 py-2">
                    {new Date(r.createdAt).toLocaleString()}
                  </td>
                  <td className="px-3 py-2 font-medium">{r.inputSponsor}</td>
                  <td className="px-3 py-2">{r.durationMs} ms</td>
                  <td className="px-3 py-2">{r.portfolioUrlsCount}</td>
                  <td className="px-3 py-2">{r.crawledCount}</td>
                  <td className="px-3 py-2">{r.extractedCount}</td>
                  <td className="px-3 py-2">{r.normalizedCount}</td>
                  <td className="px-3 py-2">{r.enrichedCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </PageContainer>
  );
}
