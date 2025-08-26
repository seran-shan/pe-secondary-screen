import PageContainer from '@/components/layout/page-container';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';

export const metadata = { title: 'Alerts' };

export default function AlertsPage() {
  return (
    <PageContainer scrollable={true}>
      <div className="flex flex-1 flex-col space-y-6">
        <div className="flex items-start justify-between">
          <Heading title="Alerts" description="Triggers and delivery preferences." />
        </div>
        <Separator />
        <div className="rounded-lg border p-6 text-sm text-muted-foreground">Coming soon.</div>
      </div>
    </PageContainer>
  );
}



