"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import PageContainer from "@/components/layout/page-container";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SponsorMetricsCards } from "@/components/sponsors/sponsor-metrics-cards";
import { SponsorPortfolioChart } from "@/components/sponsors/sponsor-portfolio-chart";
import { SponsorPortfolioTable } from "@/components/sponsors/sponsor-portfolio-table";
import { SponsorActions } from "@/components/sponsors/sponsor-actions";
import { useSponsors } from "@/components/sponsors/sponsors-provider";
import { IconArrowLeft, IconExternalLink, IconMail } from "@tabler/icons-react";
import Link from "next/link";

type SponsorData = {
  id: string;
  name: string;
  contact: string | null;
  portfolio: Array<{
    id: string;
    asset: string;
    dateInvested: Date | null;
    fsnSector: string | null;
    webpage: string | null;
    note: string | null;
    nextSteps: string | null;
    financials: string | null;
    location: string | null;
    comments: Array<{
      id: string;
      content: string;
      createdAt: Date;
      author: {
        id: string;
        name: string | null;
        email: string | null;
        image: string | null;
      };
    }>;
    watchlistedBy: Array<{
      id: string;
      userId: string;
    }>;
  }>;
};

interface SponsorDetailClientProps {
  initialSponsor: SponsorData;
}

export function SponsorDetailClient({
  initialSponsor,
}: SponsorDetailClientProps) {
  const router = useRouter();
  const { sponsors } = useSponsors();

  // Find the sponsor from context (which may have optimistic updates) or fall back to initial data
  const contextSponsor = sponsors.find((s) => s.id === initialSponsor.id);
  const sponsor = React.useMemo(() => {
    if (contextSponsor?.portfolio) {
      // Convert context sponsor portfolio to detail format
      const convertedPortfolio = contextSponsor.portfolio.map((p, index) => ({
        id: p._tempId ?? `${initialSponsor.id}-${index}`, // Use temp ID for optimistic or generate
        asset: p.asset ?? "Unknown Company",
        dateInvested: p.dateInvested ? new Date(p.dateInvested) : null,
        fsnSector: p.fsnSector ?? null,
        webpage: p.webpage ?? null,
        note: null,
        nextSteps: null,
        financials: null,
        location: null,
        comments: [],
        watchlistedBy: [],
        _optimistic: p._optimistic,
        _tempId: p._tempId,
      }));

      return {
        ...initialSponsor,
        portfolio: convertedPortfolio,
      };
    }
    return initialSponsor;
  }, [contextSponsor, initialSponsor]);

  const handlePortfolioUpdate = React.useCallback(() => {
    // Refresh the page to get updated portfolio data
    router.refresh();
  }, [router]);

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
              <Link href="/workspace/sponsors">
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
          <SponsorActions
            sponsor={sponsor}
            onPortfolioUpdate={handlePortfolioUpdate}
          />
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
