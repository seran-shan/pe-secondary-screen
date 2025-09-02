"use client";

import * as React from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

interface SponsorPortfolioChartProps {
  sponsor: {
    portfolio: Array<{
      sector?: string | null;
      dateInvested?: Date | null;
    }>;
  };
}

const chartConfig = {
  companies: {
    label: "Companies",
    color: "var(--primary)",
  },
} satisfies ChartConfig;

export function SponsorPortfolioChart({ sponsor }: SponsorPortfolioChartProps) {
  const [chartType, setChartType] = React.useState<"sector" | "timeline">(
    "sector",
  );

  // Process data for sector distribution
  const sectorData = React.useMemo(() => {
    const sectorCounts = sponsor.portfolio.reduce(
      (acc, company) => {
        const sector = company.sector ?? "Unknown";
        acc[sector] = (acc[sector] ?? 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    return Object.entries(sectorCounts)
      .map(([sector, count]) => ({
        sector: sector.length > 15 ? sector.substring(0, 15) + "..." : sector,
        companies: count,
      }))
      .sort((a, b) => b.companies - a.companies)
      .slice(0, 8); // Show top 8 sectors
  }, [sponsor.portfolio]);

  // Process data for investment timeline
  const timelineData = React.useMemo(() => {
    const currentYear = new Date().getFullYear();
    const yearCounts = sponsor.portfolio
      .filter((p) => p.dateInvested)
      .reduce(
        (acc, company) => {
          const year = company.dateInvested!.getFullYear();
          acc[year] = (acc[year] ?? 0) + 1;
          return acc;
        },
        {} as Record<number, number>,
      );

    // Fill in missing years and create chart data
    const years = [];
    for (let year = currentYear - 5; year <= currentYear; year++) {
      years.push({
        year: year.toString(),
        companies: yearCounts[year] ?? 0,
      });
    }
    return years;
  }, [sponsor.portfolio]);

  const currentData = chartType === "sector" ? sectorData : timelineData;
  const dataKey = chartType === "sector" ? "sector" : "year";

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>Portfolio Analysis</CardTitle>
        <CardDescription>
          <span className="hidden @[540px]/card:block">
            {chartType === "sector"
              ? "Distribution by sector"
              : "Investment timeline over the past 6 years"}
          </span>
          <span className="@[540px]/card:hidden">
            Portfolio {chartType === "sector" ? "sectors" : "timeline"}
          </span>
        </CardDescription>
        <CardAction>
          <ToggleGroup
            type="single"
            value={chartType}
            onValueChange={(value) =>
              value && setChartType(value as typeof chartType)
            }
            variant="outline"
            className="hidden *:data-[slot=toggle-group-item]:!px-4 @[767px]/card:flex"
          >
            <ToggleGroupItem value="sector">By Sector</ToggleGroupItem>
            <ToggleGroupItem value="timeline">Timeline</ToggleGroupItem>
          </ToggleGroup>
          <Select
            value={chartType}
            onValueChange={(value) => setChartType(value as typeof chartType)}
          >
            <SelectTrigger
              className="flex w-32 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/card:hidden"
              size="sm"
              aria-label="Select chart type"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="sector" className="rounded-lg">
                By Sector
              </SelectItem>
              <SelectItem value="timeline" className="rounded-lg">
                Timeline
              </SelectItem>
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <BarChart data={currentData} margin={{ left: 12, right: 12 }}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey={dataKey}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value: string) =>
                chartType === "sector"
                  ? value.length > 8
                    ? value.substring(0, 8) + "..."
                    : value
                  : value
              }
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              allowDecimals={false}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="dashed" />}
            />
            <Bar
              dataKey="companies"
              fill="var(--color-companies)"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
