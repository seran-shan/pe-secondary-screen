import PageContainer from "@/components/layout/page-container";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { SecondaryInteractive } from "@/components/containers/radar-interactive";

export const metadata = { title: "Run scan" };

export default async function RunPage({
  searchParams,
}: {
  searchParams: Promise<{ name?: string }>;
}) {
  const sp = await searchParams;
  const defaultSponsor = typeof sp?.name === "string" ? sp.name : undefined;
  return (
    <PageContainer scrollable={true}>
      <div className="flex flex-1 flex-col space-y-6">
        <div className="flex items-start justify-between">
          <Heading
            title="Run scan"
            description="Search a sponsor/GP and run Exit Radar."
          />
        </div>
        <Separator />
        <SecondaryInteractive defaultSponsor={defaultSponsor} />
      </div>
    </PageContainer>
  );
}
