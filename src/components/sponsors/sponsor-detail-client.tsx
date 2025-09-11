"use client";

import * as React from "react";
import PageContainer from "@/components/layout/page-container";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SponsorMetricsCards } from "@/components/sponsors/sponsor-metrics-cards";
import { SponsorPortfolioChart } from "@/components/sponsors/sponsor-portfolio-chart";
import { SponsorPortfolioTable } from "@/components/sponsors/sponsor-portfolio-table";
import { SponsorActions } from "@/components/sponsors/sponsor-actions";
import { SponsorRunStepper } from "@/components/sponsors/sponsor-run-stepper";
import { api } from "@/trpc/react";
import { IconArrowLeft, IconExternalLink, IconMail } from "@tabler/icons-react";
import Link from "next/link";
import type {
  Sponsor,
  PortfolioCompany,
  Comment,
  User,
  Watchlist,
} from "@prisma/client";

type SponsorData = Sponsor & {
  portfolio: Array<
    PortfolioCompany & {
      comments: Array<
        Comment & {
          author: Pick<User, "id" | "name" | "email" | "image">;
        }
      >;
      watchlistedBy: Watchlist[];
    }
  >;
};

interface SponsorDetailClientProps {
  initialSponsor: SponsorData;
}

export function SponsorDetailClient({
  initialSponsor,
}: SponsorDetailClientProps) {
  // First get the active run status
  const { data: activeRun } = api.agent.activeRunForSponsor.useQuery(
    { sponsorId: initialSponsor.id },
    {
      refetchInterval: 5000, // Reduced from 2s to 5s
      staleTime: 10_000, // Consider data stale after 10 seconds
    },
  );

  // Use tRPC query to get live sponsor data that updates automatically
  const { data: sponsorData } = api.sponsor.getByIdWithPortfolio.useQuery(
    { id: initialSponsor.id },
    {
      initialData: {
        id: initialSponsor.id,
        name: initialSponsor.name,
        contact: initialSponsor.contact,
        portfolioUrl: initialSponsor.portfolioUrl,
        portfolio: initialSponsor.portfolio.map((p) => ({
          asset: p.asset,
          webpage: p.webpage ?? undefined,
          sector: p.sector ?? undefined,
          dateInvested: p.dateInvested
            ? p.dateInvested.toISOString()
            : undefined,
        })),
      },
      refetchInterval: (_data) => {
        // Only refetch if there's an active run, otherwise use longer interval
        return activeRun ? 10000 : false; // 10 seconds during active runs, no polling otherwise
      },
      staleTime: 30_000, // Consider data stale after 30 seconds
    },
  );

  // Use live data if available, fallback to initial data
  const sponsor = sponsorData ?? {
    ...initialSponsor,
    portfolio: initialSponsor.portfolio.map((p) => ({
      asset: p.asset,
      webpage: p.webpage ?? undefined,
      sector: p.sector ?? undefined,
      dateInvested: p.dateInvested ? p.dateInvested.toISOString() : undefined,
    })),
  };

  // Create a hybrid portfolio that combines live data with initial data for comments/watchlist
  const hybridPortfolio = React.useMemo(() => {
    if (!sponsorData) return initialSponsor.portfolio;

    // Create a map of initial portfolio companies by asset name for quick lookup
    const initialMap = new Map(
      initialSponsor.portfolio.map((p) => [p.asset, p]),
    );

    // Merge live data with initial data for comments and watchlist
    return sponsorData.portfolio.map((liveCompany) => {
      const initialCompany = initialMap.get(liveCompany.asset);
      return {
        ...liveCompany,
        // Convert dateInvested back to Date object if it exists
        dateInvested: liveCompany.dateInvested
          ? new Date(liveCompany.dateInvested)
          : null,
        // Ensure all required PortfolioCompany fields are present
        id: initialCompany?.id ?? liveCompany.asset, // Use asset as fallback ID
        sponsorId: initialSponsor.id,
        createdAt: initialCompany?.createdAt ?? new Date(),
        updatedAt: initialCompany?.updatedAt ?? new Date(),
        description: initialCompany?.description ?? null,
        location: initialCompany?.location ?? null,
        status: initialCompany?.status ?? "ACTIVE",
        // Convert undefined to null for sector and webpage to match expected types
        sector: liveCompany.sector ?? null,
        webpage: liveCompany.webpage ?? null,
        // Keep comments and watchlist from initial data
        comments: initialCompany?.comments ?? [],
        watchlistedBy: initialCompany?.watchlistedBy ?? [],
      };
    });
  }, [sponsorData, initialSponsor.portfolio, initialSponsor.id]);

  const handlePortfolioUpdate = React.useCallback(() => {
    // The tRPC query will automatically refetch due to invalidation
    // No need to refresh the page
  }, []);

  // Calculate metrics using hybrid portfolio
  const totalCompanies = hybridPortfolio.length;
  const totalSectors = new Set(
    hybridPortfolio.map((p) => p.sector).filter(Boolean),
  ).size;
  const averageInvestmentAge =
    hybridPortfolio
      .filter((p) => p.dateInvested)
      .reduce((acc, p) => {
        const years = p.dateInvested
          ? (new Date().getTime() - p.dateInvested.getTime()) /
            (1000 * 60 * 60 * 24 * 365)
          : 0;
        return acc + years;
      }, 0) / hybridPortfolio.filter((p) => p.dateInvested).length || 0;

  // Calculate recent activity from hybrid portfolio
  const recentActivity = hybridPortfolio.reduce((acc, p) => {
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
          <SponsorActions
            sponsor={sponsor}
            onPortfolioUpdate={handlePortfolioUpdate}
          />
        </div>

        {activeRun && <SponsorRunStepper runId={activeRun.runId} />}

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
          <SponsorPortfolioChart
            sponsor={{ ...sponsor, portfolio: hybridPortfolio }}
          />
        </div>

        {/* Portfolio Companies Table */}
        <SponsorPortfolioTable
          companies={hybridPortfolio}
          sponsorName={sponsor.name}
          sponsorId={sponsor.id}
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
