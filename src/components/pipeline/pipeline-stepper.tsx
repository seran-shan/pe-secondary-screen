"use client";

import { type RouterOutputs } from "@/trpc/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { IconCheck, IconCircle, IconCircleDashed } from "@tabler/icons-react";

type RunResult = RouterOutputs["agent"]["run"];

export function PipelineStepper(props: { data: RunResult }) {
  const { data } = props;

  const steps = [
    {
      key: "Finder",
      label: "Finder",
      complete: (data.portfolioUrls?.length ?? 0) > 0,
    },
    {
      key: "Crawler",
      label: "Crawler",
      complete: (data.crawledCount ?? 0) > 0,
    },
    {
      key: "Extractor",
      label: "Extractor",
      complete: (data.extractedCount ?? 0) > 0,
    },
    {
      key: "Normalizer",
      label: "Normalizer",
      complete: (data.normalizedCount ?? 0) > 0,
    },
    {
      key: "Enricher",
      label: "Enricher",
      complete: (data.enrichedCount ?? 0) > 0,
    },
    {
      key: "Writer",
      label: "Writer",
      // mark complete if we got through enrichment (placeholder until writer persists)
      complete: (data.enrichedCount ?? 0) > 0,
    },
  ] as const;

  const completed = steps.filter((s) => s.complete).length;
  const percent = Math.round((completed / steps.length) * 100);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Pipeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Progress value={percent} />
            <div className="mt-2 text-sm text-muted-foreground">{percent}% complete</div>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {steps.map((step, idx) => (
              <div key={step.key} className="flex items-center gap-3 rounded-md border p-3">
                <div className="shrink-0">
                  {step.complete ? (
                    <IconCheck className="text-emerald-600" />
                  ) : idx === completed ? (
                    <IconCircleDashed className="text-indigo-600" />
                  ) : (
                    <IconCircle className="text-muted-foreground" />
                  )}
                </div>
                <div className="flex flex-col">
                  <span className="font-medium">{step.label}</span>
                  <span className="text-xs text-muted-foreground">
                    {step.complete ? "Completed" : idx === completed ? "In progress" : "Pending"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Run metrics</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Badge variant="secondary">URLs: {data.portfolioUrls.length}</Badge>
          <Badge variant="secondary">Crawled: {data.crawledCount}</Badge>
          <Badge variant="secondary">Extracted: {data.extractedCount}</Badge>
          <Badge variant="secondary">Normalized: {data.normalizedCount}</Badge>
          <Badge variant="secondary">Enriched: {data.enrichedCount}</Badge>
        </CardContent>
      </Card>
    </div>
  );
}


