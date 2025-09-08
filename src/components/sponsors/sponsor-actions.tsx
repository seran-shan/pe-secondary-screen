"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  IconEdit,
  IconDotsVertical,
  IconDownload,
  IconShare,
  IconTrash,
  IconRefresh,
  IconSearch,
  IconSparkles,
} from "@tabler/icons-react";
import { Loader2 } from "lucide-react";
import { DeleteSponsorDialog } from "./delete-sponsor-dialog";
import { AgentProgressModal, type AgentStep } from "./agent-progress-modal";
import {
  DiscoveryConfirmationDialog,
  type DiscoveryMode,
} from "./discovery-confirmation-dialog";
import { api } from "@/trpc/react";
import { toast } from "sonner";
import type { RunState } from "@/server/agents/run-registry";

interface SponsorActionsProps {
  sponsor: {
    id: string;
    name: string;
    portfolioUrl?: string | null;
  };
  onPortfolioUpdate?: () => void;
}

export function SponsorActions({
  sponsor,
  onPortfolioUpdate,
}: SponsorActionsProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [confirmationDialogOpen, setConfirmationDialogOpen] =
    React.useState(false);
  const [agentModalOpen, setAgentModalOpen] = React.useState(false);
  const [agentSteps, setAgentSteps] = React.useState<AgentStep[]>([]);
  const [agentStartTime, setAgentStartTime] = React.useState<Date | null>(null);
  const [isAgentRunning, setIsAgentRunning] = React.useState(false);

  // Query to check existing portfolio status - always enabled for button state
  const { data: portfolioStatus } = api.agent.checkPortfolioStatus.useQuery({
    sponsorId: sponsor.id,
  });

  // Disable discover if an active run exists for this sponsor
  const { data: activeRunForSponsor } = api.agent.activeRunForSponsor.useQuery(
    { sponsorId: sponsor.id },
    {
      refetchInterval: 3000,
    },
  );

  const utils = api.useUtils();

  // Live run endpoints
  const startMutation = api.agent.start.useMutation();
  const cancelMutation = api.agent.cancel.useMutation();
  const [currentRunId, setCurrentRunId] = React.useState<string | null>(null);
  const [pollInterval, setPollInterval] = React.useState(500);

  // Use direct HTTP fetch instead of tRPC to avoid auth overhead
  const [runData, setRunData] = React.useState<RunState | null>(null);

  React.useEffect(() => {
    // Reattach if a run is active from elsewhere
    if (typeof window !== "undefined") {
      const active = localStorage.getItem("agent_current_run_id");
      if (active) setCurrentRunId(active);
    }
  }, []);

  React.useEffect(() => {
    if (!currentRunId) return;

    let timeoutId: NodeJS.Timeout;

    const fetchRunData = async () => {
      try {
        const res = await fetch(`/api/agent/run/${currentRunId}`);
        if (res.ok) {
          const data = (await res.json()) as RunState;
          setRunData(data);

          // Smart polling: exponential backoff
          if (["completed", "error", "cancelled"].includes(data.status)) {
            // Stop polling when done
            return;
          } else {
            // Exponential backoff: 500ms → 1s → 2s → 3s max
            const nextInterval = Math.min(pollInterval * 1.5, 3000);
            setPollInterval(nextInterval);
            timeoutId = setTimeout(() => void fetchRunData(), nextInterval);
          }
        }
      } catch (err) {
        console.error("Failed to fetch run data:", err);
        // Retry with longer interval on error
        timeoutId = setTimeout(() => void fetchRunData(), 5000);
      }
    };

    // Start fetching immediately
    void fetchRunData();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [currentRunId, pollInterval]);

  // Sync server run state to UI
  React.useEffect(() => {
    if (!runData) return;

    const steps = initializeAgentSteps();
    const stepMap = new Map(steps.map((s) => [s.id, s]));

    // Update each step from server state
    Object.entries(runData.steps).forEach(([id, serverStep]) => {
      const step = stepMap.get(id);
      if (step && serverStep) {
        step.status = serverStep.status as AgentStep["status"];
        step.count = serverStep.count;
        step.error = serverStep.error;
      }
    });

    setAgentSteps(Array.from(stepMap.values()));

    // Handle run completion
    const isFinished = ["completed", "error", "cancelled"].includes(
      runData.status,
    );
    if (isFinished) {
      setIsAgentRunning(false);
      setCurrentRunId(null);

      const messages = {
        completed: `Added ${runData.totals.enriched ?? 0} new portfolio companies to ${sponsor.name}`,
        cancelled: "Portfolio discovery cancelled",
        error: runData.error ?? "Portfolio discovery failed",
      };

      if (runData.status === "completed") toast.success(messages.completed);
      else if (runData.status === "cancelled") toast.info(messages.cancelled);
      else toast.error(messages.error);

      // Real-time refresh of sponsor data and companies list
      void utils.sponsor.getByIdWithPortfolio.invalidate({ id: sponsor.id });
      void utils.company.getAll.invalidate();
      onPortfolioUpdate?.();
      if (typeof window !== "undefined") {
        localStorage.removeItem("agent_current_run_id");
      }
    }
  }, [runData, sponsor.id, sponsor.name, utils.sponsor, onPortfolioUpdate]);

  const initializeAgentSteps = (): AgentStep[] => {
    return [
      {
        id: "finder",
        name: "Finding URLs",
        icon: () => null, // Will be overridden by modal
        description: "Searching for portfolio company pages",
        status: "pending" as const,
      },
      {
        id: "extractor",
        name: "AI Extraction",
        icon: () => null,
        description: "Using AI to identify portfolio companies",
        status: "pending" as const,
      },
      {
        id: "normalizer",
        name: "Normalizing Data",
        icon: () => null,
        description: "Cleaning and standardizing company data",
        status: "pending" as const,
      },
      {
        id: "enricher",
        name: "Enriching Details",
        icon: () => null,
        description: "Adding additional company information",
        status: "pending" as const,
      },
      {
        id: "writer",
        name: "Saving Results",
        icon: () => null,
        description: "Updating portfolio database",
        status: "pending" as const,
      },
    ];
  };

  const startLiveDiscovery = async (mode: DiscoveryMode) => {
    const steps = initializeAgentSteps();
    setAgentSteps(steps);
    setAgentStartTime(new Date());
    setIsAgentRunning(true);
    setAgentModalOpen(true);

    try {
      const res = await startMutation.mutateAsync({
        sponsorId: sponsor.id,
        mode,
      });

      setCurrentRunId(res.runId);
      if (typeof window !== "undefined") {
        localStorage.setItem("agent_current_run_id", res.runId);
      }
      setPollInterval(500); // Reset poll interval for new run
    } catch (err) {
      console.error(`[UI] Failed to start run`, err);
      setIsAgentRunning(false);
      toast.error("Failed to start portfolio discovery");
    }
  };

  const [currentMode, setCurrentMode] = React.useState<DiscoveryMode>("append");

  const handleDiscoverPortfolio = () => {
    // If no existing data, skip confirmation and go directly to discovery
    if (
      !portfolioStatus?.hasExistingData ||
      portfolioStatus?.companiesCount === 0
    ) {
      setCurrentMode("append");
      void startLiveDiscovery("append");
    } else {
      setConfirmationDialogOpen(true);
    }
  };

  const handleConfirmDiscovery = (mode: DiscoveryMode) => {
    setConfirmationDialogOpen(false);
    setCurrentMode(mode);
    void startLiveDiscovery(mode);
  };

  const handleCancelAgent = async () => {
    if (currentRunId) {
      try {
        await cancelMutation.mutateAsync({ runId: currentRunId });
      } catch (e) {
        console.error("Failed to cancel run", e);
      }
    }

    // Reset all state immediately
    setIsAgentRunning(false);
    setAgentModalOpen(false);
    setAgentSteps([]);
    setAgentStartTime(null);
    setCurrentRunId(null);
    setRunData(null);
    setPollInterval(500);
    if (typeof window !== "undefined") {
      localStorage.removeItem("agent_current_run_id");
    }
  };

  const handleAgentComplete = () => {
    setAgentModalOpen(false);
    // Keep steps and start time for potential viewing later
  };

  return (
    <>
      <div className="flex items-center gap-2">
        {/* Primary Action - Discover Portfolio */}
        <Button
          onClick={handleDiscoverPortfolio}
          disabled={isAgentRunning || !!activeRunForSponsor}
          size="lg"
          className="relative"
        >
          {isAgentRunning || activeRunForSponsor ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              <span className="hidden sm:inline">Discovery in progress…</span>
            </>
          ) : portfolioStatus?.hasExistingData ? (
            <>
              <IconRefresh className="size-4" />
              <span className="hidden sm:inline">Update Portfolio</span>
              <IconSparkles className="ml-1 size-3 text-yellow-400" />
            </>
          ) : (
            <>
              <IconSearch className="size-4" />
              <span className="hidden sm:inline">Discover Portfolio</span>
              <IconSparkles className="ml-1 size-3 text-yellow-400" />
            </>
          )}
        </Button>

        {/* More Actions Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon">
              <IconDotsVertical className="size-4" />
              <span className="sr-only">More actions</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem>
              <IconEdit className="size-4" />
              Edit Sponsor
            </DropdownMenuItem>
            <DropdownMenuItem>
              <IconDownload className="size-4" />
              Export Portfolio
            </DropdownMenuItem>
            <DropdownMenuItem>
              <IconShare className="size-4" />
              Share Report
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onClick={() => setDeleteDialogOpen(true)}
            >
              <IconTrash className="size-4" />
              Delete Sponsor
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <DeleteSponsorDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        sponsor={sponsor}
      />

      <AgentProgressModal
        open={agentModalOpen}
        onOpenChange={setAgentModalOpen}
        sponsorName={sponsor.name}
        steps={agentSteps}
        onCancel={handleCancelAgent}
        onComplete={handleAgentComplete}
        startTime={agentStartTime ?? undefined}
        discoveryMode={currentMode}
        portfolioUrl={sponsor.portfolioUrl}
      />

      <DiscoveryConfirmationDialog
        open={confirmationDialogOpen}
        onOpenChange={setConfirmationDialogOpen}
        sponsorName={sponsor.name}
        existingCompaniesCount={portfolioStatus?.companiesCount ?? 0}
        lastDiscoveryDate={portfolioStatus?.lastDiscoveryDate ?? undefined}
        portfolioUrl={sponsor.portfolioUrl}
        onConfirm={handleConfirmDiscovery}
      />
    </>
  );
}
