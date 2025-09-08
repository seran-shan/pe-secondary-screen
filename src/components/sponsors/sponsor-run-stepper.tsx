"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { IconCheck, IconX, IconClock, IconLoader2 } from "@tabler/icons-react";

type RunState = {
  runId: string;
  status: "pending" | "running" | "completed" | "error" | "cancelled";
  steps: Record<
    string,
    {
      status: "pending" | "running" | "completed" | "error";
      count?: number;
      error?: string;
    }
  >;
  totals?: Record<string, number>;
};

const ORDER = [
  "finder",
  "extractor",
  "normalizer",
  "enricher",
  "writer",
] as const;
const LABEL: Record<string, string> = {
  finder: "Finding URLs",
  extractor: "AI Extraction",
  normalizer: "Normalizing Data",
  enricher: "Enriching Details",
  writer: "Saving Results",
};

export function SponsorRunStepper({ runId }: { runId: string }) {
  const [run, setRun] = React.useState<RunState | null>(null);

  React.useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const fetchRun = async () => {
      try {
        const res = await fetch(`/api/agent/run/${runId}`);
        if (res.ok) {
          const data = (await res.json()) as RunState;
          setRun(data);
          if (["completed", "error", "cancelled"].includes(data.status)) {
            return;
          }
        }
      } catch {}
      timer = setTimeout(fetchRun, 1200);
    };
    void fetchRun();
    return () => timer && clearTimeout(timer);
  }, [runId]);

  const steps = ORDER.map((id) => ({
    id,
    ...(run?.steps?.[id] ?? { status: "pending" as const }),
  }));
  const done = steps.filter((s) => s.status === "completed").length;
  const percent = Math.round((done / steps.length) * 100);

  return (
    <Card className="border-blue-300/40 bg-blue-500/5">
      <CardContent className="space-y-4 p-4">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium">Discovery progress</div>
          <div className="text-muted-foreground text-xs">{percent}%</div>
        </div>
        <Progress value={percent} />
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
          {steps.map((s) => (
            <div
              key={s.id}
              className="flex items-center justify-between rounded-md border p-2"
            >
              <div className="flex items-center gap-2">
                {s.status === "completed" ? (
                  <IconCheck className="text-emerald-500" />
                ) : s.status === "running" ? (
                  <IconLoader2 className="animate-spin text-indigo-500" />
                ) : s.status === "error" ? (
                  <IconX className="text-red-500" />
                ) : (
                  <IconClock className="text-muted-foreground" />
                )}
                <span className="text-sm font-medium">{LABEL[s.id]}</span>
              </div>
              <Badge
                variant={
                  s.status === "completed"
                    ? "default"
                    : s.status === "running"
                      ? "secondary"
                      : s.status === "error"
                        ? "destructive"
                        : "outline"
                }
              >
                {s.status.charAt(0).toUpperCase() + s.status.slice(1)}
              </Badge>
            </div>
          ))}
        </div>
        <div className="text-muted-foreground flex flex-wrap gap-2 text-xs">
          <Badge variant="secondary">
            URLs {run?.totals?.portfolioUrls ?? 0}
          </Badge>
          <Badge variant="secondary">
            Extracted {run?.totals?.extracted ?? 0}
          </Badge>
          <Badge variant="secondary">
            Normalized {run?.totals?.normalized ?? 0}
          </Badge>
          <Badge variant="secondary">
            Enriched {run?.totals?.enriched ?? 0}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
