"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export type Sponsor = {
  name: string;
  contact?: string | null;
  portfolio?: Array<{
    asset?: string;
    webpage?: string;
    fsnSector?: string;
    dateInvested?: string;
  }>;
};

export function SponsorsList({ sponsors }: { sponsors: Sponsor[] }) {
  return (
    <div className="space-y-4">
      <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs sm:grid-cols-2 lg:grid-cols-3">
        {sponsors.map((s) => {
          const count = s.portfolio?.length ?? 0;
          const sectors = Array.from(
            new Set(
              (s.portfolio ?? [])
                .map((p) => p.fsnSector)
                .filter(Boolean) as string[],
            ),
          ).sort();
          return (
            <Card key={s.name} className="h-full">
              <CardHeader>
                <CardTitle className="text-base">{s.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="text-muted-foreground">
                  Portfolio companies: {count}
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
        })}
      </div>
    </div>
  );
}
