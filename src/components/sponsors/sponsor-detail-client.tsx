"use client";

import * as React from "react";
import PageContainer from "@/components/layout/page-container";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SponsorMetricsCards } from "@/components/sponsors/sponsor-metrics-cards";
import { SponsorPortfolioChart } from "@/components/sponsors/sponsor-portfolio-chart";
import { CompaniesDataTable } from "@/components/companies/companies-data-table";
import { SponsorActions } from "@/components/sponsors/sponsor-actions";
import { SponsorRunStepper } from "@/components/sponsors/sponsor-run-stepper";
import { api } from "@/trpc/react";
import { IconArrowLeft, IconExternalLink, IconMail } from "@tabler/icons-react";
import Link from "next/link";
import type { Sponsor, PortfolioCompany, Comment, User } from "@prisma/client";
import { pusherClient } from "@/lib/pusher.client";
import { type RunState } from "@/server/agents/run-registry";

type SponsorData = Sponsor & {
  portfolio: Array<
    PortfolioCompany & {
      comments: Array<
        Comment & {
          author: Pick<User, "id" | "name" | "email" | "image">;
        }
      >;
    }
  >;
};

interface SponsorDetailClientProps {
  initialSponsor: SponsorData;
}

export function SponsorDetailClient({
  initialSponsor,
}: SponsorDetailClientProps) {
  const [isAgentRunning, setIsAgentRunning] = React.useState(false);
  const [currentRunId, setCurrentRunId] = React.useState<string | null>(null);
  const [run, setRun] = React.useState<RunState | null>(null);

  // Check for an active run once on mount, then rely on Pusher
  const { data: activeRunForSponsor } = api.agent.activeRunForSponsor.useQuery(
    { sponsorId: initialSponsor.id },
    {
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      staleTime: Infinity,
    },
  );

  // Use tRPC query to get live sponsor data that updates automatically
  const { data: sponsorData } = api.sponsor.getByIdWithPortfolio.useQuery(
    { id: initialSponsor.id },
    {
      staleTime: Infinity,
    },
  );

  React.useEffect(() => {
    // Sync initial running state from the server once
    if (activeRunForSponsor) {
      setIsAgentRunning(true);
      if (activeRunForSponsor.runId) {
        setCurrentRunId(activeRunForSponsor.runId);
      }
    }
  }, [activeRunForSponsor, setCurrentRunId, setIsAgentRunning]);

  React.useEffect(() => {
    if (!currentRunId) return;

    const channel = pusherClient.subscribe(`run-${currentRunId}`);
    const onUpdate = (data: RunState) => {
      setRun(data);
    };

    channel.bind("update", onUpdate);

    return () => {
      channel.unbind("update", onUpdate);
      pusherClient.unsubscribe(`run-${currentRunId}`);
    };
  }, [currentRunId]);

  // Use live data if available, fallback to initial data
  const sponsor = sponsorData ?? {
    ...initialSponsor,
    portfolio: [],
  };

  // Calculate metrics for cards
  const totalCompanies = sponsor.portfolio.length;
  const totalSectors = new Set(
    sponsor.portfolio.map((p) => p.sector).filter(Boolean),
  ).size;

  const totalInvestmentAge = sponsor.portfolio
    .filter((p) => p.dateInvested)
    .reduce((acc, p) => {
      const age =
        (new Date().getTime() - new Date(p.dateInvested!).getTime()) /
        (1000 * 60 * 60 * 24 * 365.25);
      return acc + age;
    }, 0);

  const averageInvestmentAge =
    totalCompanies > 0 ? totalInvestmentAge / totalCompanies : 0;

  const recentActivity = sponsor.portfolio.reduce((acc, p) => {
    return acc + (p.comments?.length ?? 0);
  }, 0);

  const utils = api.useUtils();

  const handlePortfolioUpdate = () => {
    // Invalidate queries to refetch data
    void utils.sponsor.getByIdWithPortfolio.invalidate({ id: sponsor.id });
    void utils.company.getAll.invalidate();
  };

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
            run={run}
            setRun={setRun}
            currentRunId={currentRunId}
            setCurrentRunId={setCurrentRunId}
            isAgentRunning={isAgentRunning}
            setIsAgentRunning={setIsAgentRunning}
          />
        </div>

        {isAgentRunning && run && <SponsorRunStepper run={run} />}

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
        <CompaniesDataTable data={sponsor.portfolio} hideSponsorColumn />

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
