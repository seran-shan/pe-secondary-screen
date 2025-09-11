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
            <Card className="group hover:shadow-primary/10 hover:border-primary/20 hover:from-primary/5 h-full cursor-pointer transition-all duration-300 ease-in-out hover:scale-[1.02] hover:bg-gradient-to-br hover:to-transparent hover:shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="group-hover:text-primary flex items-center gap-2 text-base transition-colors duration-300">
                  {s.name}
                  <div className="ml-auto opacity-0 transition-all duration-300 group-hover:translate-x-1 group-hover:opacity-100">
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="text-muted-foreground group-hover:text-foreground/80 transition-colors duration-300">
                  Portfolio companies:{" "}
                  <span className="text-primary font-medium">
                    {portfolioCount}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {sectors.slice(0, 6).map((sec) => (
                    <Badge
                      key={sec}
                      variant="outline"
                      className="group-hover:bg-primary/10 group-hover:border-primary/30 group-hover:text-primary transition-all duration-300"
                    >
                      {sec}
                    </Badge>
                  ))}
                  {sectors.length > 6 && (
                    <Badge
                      variant="secondary"
                      className="group-hover:bg-primary/20 group-hover:text-primary transition-all duration-300"
                    >
                      +{sectors.length - 6}
                    </Badge>
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
