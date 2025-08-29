import PageContainer from "@/components/layout/page-container";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { api } from "@/trpc/server";

export const metadata = { title: "Watchlist" };

export default async function WatchlistPage() {
  const items = await api.watchlist.list();
  return (
    <PageContainer scrollable={true}>
      <div className="flex flex-1 flex-col space-y-6">
        <div className="flex items-start justify-between">
          <Heading
            title="Watchlist"
            description="Saved companies and filters."
          />
        </div>
        <Separator />
        <div className="overflow-hidden rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Company</th>
                <th className="px-3 py-2 text-left font-medium">Sponsor</th>
                <th className="px-3 py-2 text-left font-medium">Invested</th>
                <th className="px-3 py-2 text-left font-medium">Sector</th>
                <th className="px-3 py-2 text-left font-medium">Source</th>
              </tr>
            </thead>
            <tbody>
              {items.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="px-3 py-2 font-medium">{r.company}</td>
                  <td className="px-3 py-2">{r.sponsor}</td>
                  <td className="px-3 py-2">
                    {r.invested
                      ? new Date(r.invested).toISOString().slice(0, 10)
                      : "-"}
                  </td>
                  <td className="px-3 py-2">{r.sector ?? "-"}</td>
                  <td className="px-3 py-2">
                    {r.source ? (
                      <a
                        className="text-blue-600 hover:underline"
                        href={r.source}
                        target="_blank"
                        rel="noreferrer"
                      >
                        link
                      </a>
                    ) : (
                      "-"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </PageContainer>
  );
}
