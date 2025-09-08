"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AgentProgressModal,
  type AgentStep,
} from "@/components/sponsors/agent-progress-modal";
import { api } from "@/trpc/react";

type RunState = {
  runId: string;
  sponsorName: string;
  status: "pending" | "running" | "completed" | "error" | "cancelled";
  steps: Record<
    string,
    { status: AgentStep["status"]; count?: number; error?: string }
  >;
  totals?: Record<string, number>;
};

const LS_KEY = "agent_current_run_id";

export function ActiveRunIndicator() {
  const [runId, setRunId] = React.useState<string | null>(null);
  const [visible, setVisible] = React.useState(false);
  const [run, setRun] = React.useState<RunState | null>(null);
  const [pollMs, setPollMs] = React.useState(1000);

  React.useEffect(() => {
    const stored =
      typeof window !== "undefined" ? localStorage.getItem(LS_KEY) : null;
    if (stored) setRunId(stored);
  }, []);

  // Fallback: ask server for active run for current user
  const { data: activeFromServer } = api.agent.activeRun.useQuery(undefined, {
    refetchOnWindowFocus: true,
    refetchInterval: runId ? false : 5000,
  });

  React.useEffect(() => {
    if (!runId && activeFromServer?.runId) {
      setRunId(activeFromServer.runId);
      if (typeof window !== "undefined") {
        localStorage.setItem(LS_KEY, activeFromServer.runId);
      }
    }
  }, [activeFromServer, runId]);

  React.useEffect(() => {
    if (!runId) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const fetchRun = async () => {
      try {
        const res = await fetch(`/api/agent/run/${runId}`);
        if (res.ok) {
          const data = (await res.json()) as RunState;
          setRun(data);
          if (["completed", "error", "cancelled"].includes(data.status)) {
            // clear stored id when finished
            localStorage.removeItem(LS_KEY);
            setRunId(null);
            return;
          }
        }
      } catch {}
      timer = setTimeout(fetchRun, Math.min(pollMs * 1.5, 4000));
      setPollMs((m) => Math.min(m * 1.5, 4000));
    };
    void fetchRun();
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [runId, pollMs]);

  if (!runId) return null;

  return (
    <div className="flex items-center gap-2">
      <Badge variant="secondary">Discovery running</Badge>
      <Button size="sm" variant="outline" onClick={() => setVisible(true)}>
        View progress
      </Button>
      <AgentProgressModal
        open={visible}
        onOpenChange={setVisible}
        sponsorName={run?.sponsorName ?? ""}
        steps={mapSteps(run)}
        discoveryMode={undefined}
      />
    </div>
  );
}

function mapSteps(run: RunState | null): AgentStep[] {
  const base: AgentStep[] = [
    {
      id: "finder",
      name: "Finding URLs",
      icon: () => null,
      description: "",
      status: "pending",
    },
    {
      id: "extractor",
      name: "AI Extraction",
      icon: () => null,
      description: "",
      status: "pending",
    },
    {
      id: "normalizer",
      name: "Normalizing Data",
      icon: () => null,
      description: "",
      status: "pending",
    },
    {
      id: "enricher",
      name: "Enriching Details",
      icon: () => null,
      description: "",
      status: "pending",
    },
    {
      id: "writer",
      name: "Saving Results",
      icon: () => null,
      description: "",
      status: "pending",
    },
  ];
  if (!run) return base;
  const map = new Map(base.map((s) => [s.id, s]));
  Object.entries(run.steps).forEach(([id, s]) => {
    const step = map.get(id);
    if (step) {
      step.status = s.status;
      step.count = s.count;
      step.error = s.error;
    }
  });
  return Array.from(map.values());
}
