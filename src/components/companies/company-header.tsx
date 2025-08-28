"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  IconArrowLeft,
  IconExternalLink,
  IconEye,
  IconEyeOff,
  IconMapPin,
  IconCalendar,
  IconBuilding,
  IconChartLine,
} from "@tabler/icons-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

interface CompanyHeaderProps {
  company: {
    id: string;
    asset: string;
    dateInvested?: Date | null;
    fsnSector?: string | null;
    webpage?: string | null;
    location?: string | null;
    financials?: string | null;
    sponsor: {
      id: string;
      name: string;
    };
    watchlistedBy: Array<{ user: { name?: string | null } }>;
  };
  isWatchlisted?: boolean;
  onToggleWatchlist?: () => void;
}

export function CompanyHeader({
  company,
  isWatchlisted = false,
  onToggleWatchlist,
}: CompanyHeaderProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/companies">
            <IconArrowLeft className="mr-2 h-4 w-4" />
            Back to Companies
          </Link>
        </Button>
      </div>

      <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div className="space-y-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {company.asset}
            </h1>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-muted-foreground">Sponsored by</span>
              <Link
                href={`/sponsors/${company.sponsor.id}`}
                className="hover:underline"
              >
                <Badge variant="outline" className="text-sm">
                  {company.sponsor.name}
                </Badge>
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {company.dateInvested && (
              <div className="flex items-center gap-2">
                <IconCalendar className="text-muted-foreground h-4 w-4" />
                <div>
                  <p className="text-sm font-medium">Investment Date</p>
                  <p className="text-muted-foreground text-sm">
                    {formatDistanceToNow(company.dateInvested, {
                      addSuffix: true,
                    })}
                  </p>
                </div>
              </div>
            )}

            {company.fsnSector && (
              <div className="flex items-center gap-2">
                <IconBuilding className="text-muted-foreground h-4 w-4" />
                <div>
                  <p className="text-sm font-medium">Sector</p>
                  <p className="text-muted-foreground text-sm">
                    {company.fsnSector}
                  </p>
                </div>
              </div>
            )}

            {company.location && (
              <div className="flex items-center gap-2">
                <IconMapPin className="text-muted-foreground h-4 w-4" />
                <div>
                  <p className="text-sm font-medium">Location</p>
                  <p className="text-muted-foreground text-sm">
                    {company.location}
                  </p>
                </div>
              </div>
            )}

            {company.financials && (
              <div className="flex items-center gap-2">
                <IconChartLine className="text-muted-foreground h-4 w-4" />
                <div>
                  <p className="text-sm font-medium">Financials</p>
                  <p className="text-muted-foreground text-sm">Available</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3 md:items-end">
          <div className="flex gap-2">
            {company.webpage && (
              <Button variant="outline" size="sm" asChild>
                <a
                  href={company.webpage}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <IconExternalLink className="mr-2 h-4 w-4" />
                  Visit Website
                </a>
              </Button>
            )}

            <Button
              variant={isWatchlisted ? "default" : "outline"}
              size="sm"
              onClick={onToggleWatchlist}
            >
              {isWatchlisted ? (
                <>
                  <IconEye className="mr-2 h-4 w-4" />
                  Watching
                </>
              ) : (
                <>
                  <IconEyeOff className="mr-2 h-4 w-4" />
                  Add to Watchlist
                </>
              )}
            </Button>
          </div>

          {company.watchlistedBy.length > 0 && (
            <p className="text-muted-foreground text-sm">
              {company.watchlistedBy.length} user
              {company.watchlistedBy.length !== 1 ? "s" : ""} watching
            </p>
          )}
        </div>
      </div>

      <Separator />
    </div>
  );
}
