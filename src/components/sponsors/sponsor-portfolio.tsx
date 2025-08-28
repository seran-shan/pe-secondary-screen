"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  IconBuilding,
  IconExternalLink,
  IconEye,
  IconCalendar,
  IconSearch,
  IconMapPin,
} from "@tabler/icons-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

interface SponsorPortfolioProps {
  portfolio: Array<{
    id: string;
    asset: string;
    dateInvested?: Date | null;
    fsnSector?: string | null;
    webpage?: string | null;
    location?: string | null;
    note?: string | null;
    watchlistedBy: Array<{ user: { name?: string | null } }>;
  }>;
}

export function SponsorPortfolio({ portfolio }: SponsorPortfolioProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sectorFilter, setSectorFilter] = useState<string | undefined>();
  const [sortBy, setSortBy] = useState<"asset" | "dateInvested" | "sector">(
    "asset"
  );

  const sectors = [
    ...new Set(
      portfolio
        .map((company) => company.fsnSector)
        .filter(Boolean) as string[]
    ),
  ].sort();

  const filteredPortfolio = portfolio
    .filter((company) => {
      const matchesSearch = company.asset
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesSector = !sectorFilter || company.fsnSector === sectorFilter;
      return matchesSearch && matchesSector;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "asset":
          return a.asset.localeCompare(b.asset);
        case "dateInvested":
          if (!a.dateInvested && !b.dateInvested) return 0;
          if (!a.dateInvested) return 1;
          if (!b.dateInvested) return -1;
          return b.dateInvested.getTime() - a.dateInvested.getTime();
        case "sector":
          return (a.fsnSector ?? "").localeCompare(b.fsnSector ?? "");
        default:
          return 0;
      }
    });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IconBuilding className="h-5 w-5" />
          Portfolio Companies
          <Badge variant="outline" className="ml-auto">
            {portfolio.length}
          </Badge>
        </CardTitle>
        
        {/* Filters */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <IconSearch className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search companies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          
          <Select value={sectorFilter} onValueChange={setSectorFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filter by sector" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sectors</SelectItem>
              {sectors.map((sector) => (
                <SelectItem key={sector} value={sector}>
                  {sector}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={sortBy} onValueChange={(value: "asset" | "dateInvested" | "sector") => setSortBy(value)}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="asset">Company Name</SelectItem>
              <SelectItem value="dateInvested">Investment Date</SelectItem>
              <SelectItem value="sector">Sector</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      
      <CardContent>
        {filteredPortfolio.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredPortfolio.map((company) => (
              <Card key={company.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <Link
                          href={`/companies/${company.id}`}
                          className="font-semibold hover:underline"
                        >
                          {company.asset}
                        </Link>
                        {company.fsnSector && (
                          <Badge variant="outline" className="mt-1 text-xs">
                            {company.fsnSector}
                          </Badge>
                        )}
                      </div>
                      {company.watchlistedBy.length > 0 && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <IconEye className="h-3 w-3" />
                          {company.watchlistedBy.length}
                        </div>
                      )}
                    </div>

                    <div className="space-y-2 text-sm">
                      {company.dateInvested && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <IconCalendar className="h-3 w-3" />
                          <span>
                            {formatDistanceToNow(company.dateInvested, {
                              addSuffix: true,
                            })}
                          </span>
                        </div>
                      )}

                      {company.location && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <IconMapPin className="h-3 w-3" />
                          <span className="truncate">{company.location}</span>
                        </div>
                      )}

                      {company.note && (
                        <p className="line-clamp-2 text-muted-foreground">
                          {company.note}
                        </p>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" asChild className="flex-1">
                        <Link href={`/companies/${company.id}`}>
                          View Details
                        </Link>
                      </Button>
                      {company.webpage && (
                        <Button variant="outline" size="sm" asChild>
                          <a
                            href={company.webpage}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <IconExternalLink className="h-3 w-3" />
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <IconBuilding className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No companies found</h3>
            <p className="text-muted-foreground">
              {searchTerm || sectorFilter
                ? "Try adjusting your filters to see more results."
                : "This sponsor doesn't have any portfolio companies yet."}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
