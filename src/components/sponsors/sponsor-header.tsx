"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  IconArrowLeft,
  IconMail,
  IconBuilding,
  IconChartBar,
  IconCalendar,
} from "@tabler/icons-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

interface SponsorHeaderProps {
  sponsor: {
    id: string;
    name: string;
    contact?: string | null;
    createdAt: Date;
    updatedAt: Date;
    portfolio: Array<{
      id: string;
      asset: string;
      fsnSector?: string | null;
      dateInvested?: Date | null;
    }>;
  };
}

export function SponsorHeader({ sponsor }: SponsorHeaderProps) {
  const portfolioCount = sponsor.portfolio.length;
  const sectors = [
    ...new Set(
      sponsor.portfolio
        .map((company) => company.fsnSector)
        .filter(Boolean) as string[]
    ),
  ];
  const recentInvestments = sponsor.portfolio.filter(
    (company) =>
      company.dateInvested &&
      new Date().getTime() - company.dateInvested.getTime() <
        365 * 24 * 60 * 60 * 1000 // Last year
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/workspace/sponsors">
            <IconArrowLeft className="mr-2 h-4 w-4" />
            Back to Sponsors
          </Link>
        </Button>
      </div>

      <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div className="space-y-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {sponsor.name}
            </h1>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-muted-foreground">
                Member since{" "}
                {formatDistanceToNow(sponsor.createdAt, { addSuffix: true })}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="flex items-center gap-2">
              <IconBuilding className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Portfolio Size</p>
                <p className="text-lg font-bold">{portfolioCount}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <IconChartBar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Sectors</p>
                <p className="text-lg font-bold">{sectors.length}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <IconCalendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Recent Investments</p>
                <p className="text-lg font-bold">{recentInvestments}</p>
              </div>
            </div>

            {sponsor.contact && (
              <div className="flex items-center gap-2">
                <IconMail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Contact</p>
                  <p className="text-sm text-muted-foreground">Available</p>
                </div>
              </div>
            )}
          </div>

          {sectors.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-medium">Active Sectors</p>
              <div className="flex flex-wrap gap-2">
                {sectors.slice(0, 6).map((sector) => (
                  <Badge key={sector} variant="outline">
                    {sector}
                  </Badge>
                ))}
                {sectors.length > 6 && (
                  <Badge variant="outline">+{sectors.length - 6} more</Badge>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3 md:items-end">
          {sponsor.contact && (
            <Button variant="outline" size="sm" asChild>
              <a href={`mailto:${sponsor.contact}`}>
                <IconMail className="mr-2 h-4 w-4" />
                Contact Sponsor
              </a>
            </Button>
          )}
        </div>
      </div>

      <Separator />
    </div>
  );
}
