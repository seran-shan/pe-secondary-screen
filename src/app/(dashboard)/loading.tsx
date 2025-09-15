import PageContainer from "@/components/layout/page-container";
import FormCardSkeleton from "@/components/form-card-skeleton";

export default function Loading() {
  const cards = Array.from({ length: 4 }, (_, i) => i);
  return (
    <PageContainer>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {cards.map((_card, i) => (
          <FormCardSkeleton key={i} />
        ))}
      </div>
    </PageContainer>
  );
}
