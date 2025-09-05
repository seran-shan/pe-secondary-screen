"use client";

import * as React from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSponsors } from "@/components/sponsors/sponsors-provider";

export function SponsorsList() {
  const { sponsors } = useSponsors();
  return (
    <div className="space-y-4">
      <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs sm:grid-cols-2 lg:grid-cols-3">
        {sponsors.map((s) => {
          const sectors = Array.from(
            new Set(
              (s.portfolio ?? [])
                .map((p) => p.sector)
                .filter(Boolean) as string[],
            ),
          ).sort();

          const portfolioCount = s.portfolio?.length ?? 0;

          const cardContent = (
            <Card className="hover:bg-muted/50 h-full cursor-pointer transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  {s.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="text-muted-foreground">
                  Portfolio companies: {portfolioCount}
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

          return (
            <Link key={s.id} href={`/sponsors/${s.id}`}>
              {cardContent}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
