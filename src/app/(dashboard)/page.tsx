import PageContainer from "@/components/layout/page-container";
import { Separator } from "@/components/ui/separator";
import { SponsorsList } from "@/components/companies/sponsors-list";
import { SponsorsProvider } from "@/components/sponsors";
import { HomepageHero } from "@/components/homepage/homepage-hero";
import { AddSponsorButton } from "@/components/sponsors";

export const metadata = {
  title: "FSN Exit Radar",
  description: "AI-powered secondary screening for portfolio companies",
};

// Force dynamic rendering to avoid build-time DB queries
export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <PageContainer scrollable={true}>
      <div className="flex flex-1 flex-col space-y-8">
        {/* Hero Section */}
        <HomepageHero />

        <Separator />

        {/* Sponsors Section */}
        <SponsorsProvider>
          <div className="flex flex-1 flex-col space-y-6">
            <div className="flex justify-end">
              <AddSponsorButton />
            </div>
            <SponsorsList />
          </div>
        </SponsorsProvider>
      </div>
    </PageContainer>
  );
}
