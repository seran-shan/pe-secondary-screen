import { notFound } from "next/navigation";
import PageContainer from "@/components/layout/page-container";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SponsorMetricsCards } from "@/components/sponsors/sponsor-metrics-cards";
import { SponsorPortfolioChart } from "@/components/sponsors/sponsor-portfolio-chart";
import { SponsorPortfolioTable } from "@/components/sponsors/sponsor-portfolio-table";
import { SponsorActions } from "@/components/sponsors/sponsor-actions";
import { db } from "@/server/db";
import { IconArrowLeft, IconExternalLink, IconMail } from "@tabler/icons-react";
import Link from "next/link";

type Props = {
  params: Promise<{ sponsorId: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { sponsorId } = await params;
  const sponsor = await db.sponsor.findUnique({
    where: { id: sponsorId },
    select: { name: true },
  });

  return {
    title: sponsor ? `${sponsor.name} - Sponsor Details` : "Sponsor Not Found",
  };
}

export default async function SponsorDetailPage({ params }: Props) {
  const { sponsorId } = await params;

  const sponsor = await db.sponsor.findUnique({
    where: { id: sponsorId },
    include: {
      portfolio: {
        include: {
          comments: {
            include: {
              author: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  image: true,
                },
              },
            },
            orderBy: { createdAt: "desc" },
          },
          watchlistedBy: true,
        },
        orderBy: { dateInvested: "desc" },
      },
    },
  });

  if (!sponsor) {
    notFound();
  }

  // Calculate metrics
  const totalCompanies = sponsor.portfolio.length;
  const totalSectors = new Set(
    sponsor.portfolio.map((p) => p.fsnSector).filter(Boolean),
  ).size;
  const averageInvestmentAge =
    sponsor.portfolio
      .filter((p) => p.dateInvested)
      .reduce((acc, p) => {
        const years = p.dateInvested
          ? (new Date().getTime() - p.dateInvested.getTime()) /
            (1000 * 60 * 60 * 24 * 365)
          : 0;
        return acc + years;
      }, 0) / sponsor.portfolio.filter((p) => p.dateInvested).length || 0;

  const recentActivity = sponsor.portfolio.reduce((acc, p) => {
    return acc + p.comments.length;
  }, 0);

  return (
    <PageContainer scrollable={true}>
      <div className="flex flex-1 flex-col space-y-6">
        {/* Header with Back Button */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/sponsors">
                <IconArrowLeft className="size-4" />
                <span className="sr-only">Back to Sponsors</span>
              </Link>
            </Button>
            <div>
              <Heading
                title={sponsor.name}
                description="Comprehensive overview of sponsor portfolio and performance."
              />
              <div className="mt-2 flex items-center gap-2">
                {sponsor.contact && (
                  <Badge variant="outline" className="gap-1">
                    <IconMail className="size-3" />
                    Contact Available
                  </Badge>
                )}
                <Badge variant="secondary">
                  {totalCompanies} Portfolio Companies
                </Badge>
                <Badge variant="secondary">{totalSectors} Sectors</Badge>
              </div>
            </div>
          </div>
          <SponsorActions sponsor={sponsor} />
        </div>

        <Separator />

        {/* Metrics Cards */}
        <SponsorMetricsCards
          totalCompanies={totalCompanies}
          totalSectors={totalSectors}
          averageInvestmentAge={averageInvestmentAge}
          recentActivity={recentActivity}
        />

        {/* Portfolio Performance Chart */}
        <div className="px-4 lg:px-6">
          <SponsorPortfolioChart sponsor={sponsor} />
        </div>

        {/* Portfolio Companies Table */}
        <SponsorPortfolioTable
          companies={sponsor.portfolio}
          sponsorName={sponsor.name}
        />

        {/* Contact Information */}
        {sponsor.contact && (
          <div className="px-4 lg:px-6">
            <div className="bg-muted/50 rounded-lg p-4">
              <h3 className="mb-2 flex items-center gap-2 font-medium">
                <IconMail className="size-4" />
                Contact Information
              </h3>
              <div className="text-muted-foreground text-sm">
                <div className="flex items-center gap-2">
                  <span>Email:</span>
                  <a
                    href={`mailto:${sponsor.contact}`}
                    className="text-primary flex items-center gap-1 hover:underline"
                  >
                    {sponsor.contact}
                    <IconExternalLink className="size-3" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  );
}
