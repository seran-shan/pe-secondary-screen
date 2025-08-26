import PageContainer from '@/components/layout/page-container';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';

export const metadata = { title: 'Watchlist' };

export default function WatchlistPage() {
  return (
    <PageContainer scrollable={true}>
      <div className="flex flex-1 flex-col space-y-6">
        <div className="flex items-start justify-between">
          <Heading title="Watchlist" description="Saved companies and filters." />
        </div>
        <Separator />
        <div className="rounded-lg border p-6 text-sm text-muted-foreground">Coming soon.</div>
      </div>
    </PageContainer>
  );
}



