import PageContainer from '@/components/layout/page-container';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';

export const metadata = {
  title: 'Dashboard: Overview'
};

export default function OverviewPage() {
  return (
    <PageContainer scrollable>
      <div className='space-y-4'>
        <div className='flex items-start justify-between'>
          <Heading
            title='Overview'
            description='Welcome to your dashboard overview.'
          />
        </div>
        <Separator />
        <div className="flex items-center justify-center h-32 text-muted-foreground">
          Dashboard overview coming soon...
        </div>
      </div>
    </PageContainer>
  );
}
