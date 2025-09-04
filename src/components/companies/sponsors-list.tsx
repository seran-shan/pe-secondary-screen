"use client";

import * as React from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSponsors } from "@/components/sponsors/sponsors-provider";
import { IconLoader2 } from "@tabler/icons-react";

export function SponsorsList() {
  const { sponsors } = useSponsors();
  return (
    <div className="space-y-4">
      <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs sm:grid-cols-2 lg:grid-cols-3">
        {sponsors.map((s) => {
          const count = s.portfolioCount ?? s.portfolio?.length ?? 0;
          const sectors = Array.from(
            new Set(
              (s.portfolio ?? [])
                .map((p) => p.sector)
                .filter(Boolean) as string[],
            ),
          ).sort();

          const isOptimistic = s._optimistic;
          const isDiscovering = s._discoveryInProgress;
          const optimisticCount = (s.portfolio ?? []).filter(
            (p) => p._optimistic,
          ).length;

          const cardContent = (
            <Card
              className={`h-full transition-colors ${
                isOptimistic
                  ? "bg-muted/30 cursor-default opacity-70"
                  : isDiscovering
                    ? "border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/20"
                    : "hover:bg-muted/50 cursor-pointer"
              }`}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  {s.name}
                  {(isOptimistic ?? isDiscovering) && (
                    <IconLoader2 className="text-muted-foreground size-4 animate-spin" />
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="text-muted-foreground">
                  Portfolio companies: {count}
                  {optimisticCount > 0 && (
                    <span className="ml-2 text-xs text-green-600">
                      +{optimisticCount} discovering...
                    </span>
                  )}
                  {isOptimistic && (
                    <span className="ml-2 text-xs text-amber-600">
                      Creating...
                    </span>
                  )}
                  {isDiscovering && optimisticCount === 0 && (
                    <span className="ml-2 text-xs text-blue-600">
                      Discovering...
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-1">
                  {sectors.slice(0, 6).map((sec) => (
                    <Badge key={sec} variant="outline">
                      {sec}
                    </Badge>
                  ))}
                  {sectors.length > 6 && (
                    <Badge variant="secondary">+{sectors.length - 6}</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          );

          return isOptimistic ? (
            <div key={s.id}>{cardContent}</div>
          ) : (
            <Link key={s.id} href={`/sponsors/${s.id}`}>
              {cardContent}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
