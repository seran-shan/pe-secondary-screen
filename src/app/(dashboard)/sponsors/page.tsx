import PageContainer from "@/components/layout/page-container";
import { Separator } from "@/components/ui/separator";
import { SponsorsList } from "@/components/companies/sponsors-list";
import { SponsorsHeader, SponsorsProvider } from "@/components/sponsors";

export const metadata = { title: "Sponsors" };

// Force dynamic rendering to avoid build-time DB queries
export const dynamic = "force-dynamic";

export default function SponsorsPage() {
  return (
    <PageContainer scrollable={true}>
      <SponsorsProvider>
        <div className="flex flex-1 flex-col space-y-6">
          <SponsorsHeader
            title="Sponsors"
            description="Manage your portfolio sponsors and their investment details."
          />
          <Separator />
          <SponsorsList />
        </div>
      </SponsorsProvider>
    </PageContainer>
  );
}
