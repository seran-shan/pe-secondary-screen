import PageContainer from '@/components/layout/page-container';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import { SecondaryInteractive } from '@/components/containers/radar-interactive';

export const metadata = { title: 'Run scan' };

export default function RunPage() {
  return (
    <PageContainer scrollable={true}>
      <div className="flex flex-1 flex-col space-y-6">
        <div className="flex items-start justify-between">
          <Heading title="Run scan" description="Search a sponsor/GP and run Exit Radar." />
        </div>
        <Separator />
        <SecondaryInteractive />
      </div>
    </PageContainer>
  );
}



