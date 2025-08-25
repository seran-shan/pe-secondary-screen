import PageContainer from '@/components/layout/page-container';
import { Heading } from '@/components/ui/heading';

export const metadata = {
  title: 'Dashboard : Product View'
};

type PageProps = { params: Promise<{ productId: string }> };

export default async function Page(props: PageProps) {
  const params = await props.params;
  return (
    <PageContainer scrollable>
      <div className='flex-1 space-y-4'>
        <Heading
          title={`Product ${params.productId === 'new' ? 'Creation' : 'Edit'}`}
          description="Product management coming soon..."
        />
        <div className="flex items-center justify-center h-32 text-muted-foreground">
          Product form coming soon...
        </div>
      </div>
    </PageContainer>
  );
}
