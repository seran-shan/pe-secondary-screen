import {
  IconTrendingUp,
  IconTrendingDown,
  IconBuilding,
  IconClockHour3,
  IconChartPie3,
  IconBell,
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

interface SponsorMetricsCardsProps {
  totalCompanies: number;
  totalSectors: number;
  averageInvestmentAge: number;
  recentActivity: number;
}

export function SponsorMetricsCards({
  totalCompanies,
  totalSectors,
  averageInvestmentAge,
  recentActivity,
}: SponsorMetricsCardsProps) {
  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs sm:grid-cols-2 lg:px-6 xl:grid-cols-4">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Portfolio Companies</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {totalCompanies}
          </CardTitle>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Portfolio size <IconBuilding className="size-4" />
          </div>
          <div className="text-muted-foreground">
            Companies under management
          </div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Sector Coverage</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {totalSectors}
          </CardTitle>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Sector diversification <IconChartPie3 className="size-4" />
          </div>
          <div className="text-muted-foreground">
            Unique sectors represented
          </div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Avg. Investment Age</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {averageInvestmentAge.toFixed(1)}y
          </CardTitle>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Investment maturity <IconClockHour3 className="size-4" />
          </div>
          <div className="text-muted-foreground">
            Time since initial investment
          </div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Recent Activity</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {recentActivity}
          </CardTitle>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            User engagement <IconBell className="size-4" />
          </div>
          <div className="text-muted-foreground">Comments and interactions</div>
        </CardFooter>
      </Card>
    </div>
  );
}
