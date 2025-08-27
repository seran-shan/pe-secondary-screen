"use client";

import {
  IconTrendingDown,
  IconTrendingUp,
  IconEye,
  IconBuilding,
  IconShieldCheck,
  IconClock,
} from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { api } from "@/trpc/react";
import { Skeleton } from "@/components/ui/skeleton";

export function HomepageMetrics() {
  const { data: stats, isLoading } = api.run.stats.useQuery();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 px-4 sm:grid-cols-2 lg:px-6 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="@container/card">
            <CardHeader>
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-8 w-16" />
            </CardHeader>
            <CardFooter>
              <Skeleton className="h-4 w-32" />
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) return null;

  const isGrowthPositive = stats.monthlyGrowth >= 0;

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs sm:grid-cols-2 lg:px-6 xl:grid-cols-4">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total Scans</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {stats.totalRuns.toLocaleString()}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              {isGrowthPositive ? <IconTrendingUp /> : <IconTrendingDown />}
              {isGrowthPositive ? "+" : ""}
              {stats.monthlyGrowth}%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {isGrowthPositive ? "Growing" : "Declining"} this month{" "}
            {isGrowthPositive ? (
              <IconTrendingUp className="size-4" />
            ) : (
              <IconTrendingDown className="size-4" />
            )}
          </div>
          <div className="text-muted-foreground">
            {stats.thisMonthRuns} scans this month
          </div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Portfolio Companies</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {stats.totalCompanies.toLocaleString()}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconEye />
              {stats.thisMonthCompanies} new
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Discovered companies <IconEye className="size-4" />
          </div>
          <div className="text-muted-foreground">
            {stats.thisMonthCompanies} added this month
          </div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>PE Sponsors</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {stats.totalSponsors.toLocaleString()}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconBuilding />
              Active
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Tracked PE firms <IconBuilding className="size-4" />
          </div>
          <div className="text-muted-foreground">Comprehensive coverage</div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Performance</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {stats.totalRuns > 0
              ? Math.round((stats.totalCompanies / stats.totalRuns) * 10) / 10
              : 0}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconShieldCheck />
              Reliable
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Avg companies per scan <IconClock className="size-4" />
          </div>
          <div className="text-muted-foreground">Efficient discovery rate</div>
        </CardFooter>
      </Card>
    </div>
  );
}
