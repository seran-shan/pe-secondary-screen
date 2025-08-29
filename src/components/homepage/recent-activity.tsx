"use client";

import {
  IconClock,
  IconEye,
  IconBell,
  IconChevronRight,
  IconTrendingUp,
} from "@tabler/icons-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/trpc/react";
// Utility function to format relative time
const formatRelativeTime = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
};
import { useRouter } from "next/navigation";

export function RecentActivity() {
  const router = useRouter();
  const { data: recentRuns, isLoading: isLoadingRuns } =
    api.run.recent.useQuery();
  const { data: alerts, isLoading: isLoadingAlerts } =
    api.alert.list.useQuery();
  const { data: watchlist, isLoading: isLoadingWatchlist } =
    api.watchlist.list.useQuery();

  const formatDuration = (ms: number) => {
    const seconds = Math.round(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.round(seconds / 60);
    return `${minutes}m`;
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Recent Scans */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <IconClock className="text-primary size-5" />
              Recent Scans
            </CardTitle>
            <CardDescription>
              Latest portfolio screening activities
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/workspace/history")}
          >
            View all
            <IconChevronRight className="ml-1 size-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoadingRuns ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center justify-between space-x-4"
              >
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <Skeleton className="h-6 w-16" />
              </div>
            ))
          ) : recentRuns && recentRuns.length > 0 ? (
            recentRuns.map((run) => (
              <div
                key={run.id}
                className="group flex items-center justify-between space-x-4"
              >
                <div className="flex-1 space-y-1">
                  <p className="group-hover:text-primary text-sm leading-none font-medium transition-colors">
                    {run.inputSponsor}
                  </p>
                  <div className="text-muted-foreground flex items-center gap-2 text-xs">
                    <span>{formatRelativeTime(new Date(run.createdAt))}</span>
                    <span>•</span>
                    <span>{formatDuration(run.durationMs)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {run.normalizedCount} companies
                  </Badge>
                  {run.normalizedCount > 10 && (
                    <IconTrendingUp className="size-4 text-green-500" />
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-muted-foreground py-8 text-center">
              <IconClock className="mx-auto mb-2 size-8 opacity-50" />
              <p className="text-sm">No recent scans</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Watchlist & Alerts */}
      <div className="space-y-6">
        {/* Watchlist Summary */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <IconEye className="text-primary size-5" />
                Watchlist
              </CardTitle>
              <CardDescription>
                Companies you&apos;re monitoring
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/workspace/watchlist")}
            >
              View all
              <IconChevronRight className="ml-1 size-4" />
            </Button>
          </CardHeader>
          <CardContent>
            {isLoadingWatchlist ? (
              <div className="space-y-3">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                ))}
              </div>
            ) : watchlist && watchlist.length > 0 ? (
              <div className="space-y-3">
                {watchlist.slice(0, 3).map((item) => (
                  <div
                    key={item.id}
                    className="group flex items-center justify-between"
                  >
                    <div className="flex-1 space-y-1">
                      <p className="group-hover:text-primary text-sm leading-none font-medium transition-colors">
                        {item.company}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {item.sponsor} • {item.sector ?? "Unknown sector"}
                      </p>
                    </div>
                  </div>
                ))}
                {watchlist.length > 3 && (
                  <p className="text-muted-foreground pt-2 text-center text-xs">
                    +{watchlist.length - 3} more companies
                  </p>
                )}
              </div>
            ) : (
              <div className="text-muted-foreground py-6 text-center">
                <IconEye className="mx-auto mb-2 size-6 opacity-50" />
                <p className="text-sm">No companies in watchlist</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Alerts */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <IconBell className="text-primary size-5" />
                Alerts
              </CardTitle>
              <CardDescription>Recent notifications</CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/workspace/alerts")}
            >
              View all
              <IconChevronRight className="ml-1 size-4" />
            </Button>
          </CardHeader>
          <CardContent>
            {isLoadingAlerts ? (
              <div className="space-y-3">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                ))}
              </div>
            ) : alerts && alerts.length > 0 ? (
              <div className="space-y-3">
                {alerts.slice(0, 3).map((alert) => (
                  <div key={alert.id} className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={alert.readAt ? "outline" : "default"}
                        className="text-xs"
                      >
                        {alert.type}
                      </Badge>
                      {!alert.readAt && (
                        <div className="size-2 rounded-full bg-blue-500" />
                      )}
                    </div>
                    <p className="text-sm leading-relaxed">{alert.message}</p>
                    <p className="text-muted-foreground text-xs">
                      {formatRelativeTime(new Date(alert.createdAt))}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-muted-foreground py-6 text-center">
                <IconBell className="mx-auto mb-2 size-6 opacity-50" />
                <p className="text-sm">No recent alerts</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
