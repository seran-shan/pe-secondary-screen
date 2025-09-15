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
  run: RunState | null;
  setRun: React.Dispatch<React.SetStateAction<RunState | null>>;
  currentRunId: string | null;
  setCurrentRunId: React.Dispatch<React.SetStateAction<string | null>>;
  isAgentRunning: boolean;
  setIsAgentRunning: React.Dispatch<React.SetStateAction<boolean>>;
}

export function SponsorActions({
  sponsor,
  onPortfolioUpdate,
  run: runData,
  setRun: setRunData,
  currentRunId: _currentRunId,
  setCurrentRunId,
  isAgentRunning,
  setIsAgentRunning,
}: SponsorActionsProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [confirmationDialogOpen, setConfirmationDialogOpen] =
    React.useState(false);

  // Query to check existing portfolio status - always enabled for button state
  const { data: portfolioStatus } = api.agent.checkPortfolioStatus.useQuery({
    sponsorId: sponsor.id,
  });

  // Check for an active run once on mount, then rely on Pusher
  const { data: activeRunForSponsor } = api.agent.activeRunForSponsor.useQuery(
    { sponsorId: sponsor.id },
    {
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      staleTime: Infinity,
    },
  );

  const utils = api.useUtils();

  // Live run endpoints
  const startMutation = api.agent.start.useMutation();
  const completionToastShown = React.useRef(false);

  React.useEffect(() => {
    // Sync initial running state from the server once
    if (activeRunForSponsor) {
      setIsAgentRunning(true);
      if (activeRunForSponsor.runId) {
        setCurrentRunId(activeRunForSponsor.runId);
      }
    }
  }, [activeRunForSponsor, setCurrentRunId, setIsAgentRunning]);

  React.useEffect(() => {
    if (!runData) return;
    // Handle run completion
    const isFinished = ["completed", "error", "cancelled"].includes(
      runData.status,
    );
    if (isFinished && !completionToastShown.current) {
      completionToastShown.current = true;
      setIsAgentRunning(false);
      setCurrentRunId(null);
      setRunData(null);

      const messages = {
        completed: `Added ${
          runData.totals.added ?? 0
        } new portfolio companies to ${sponsor.name}`,
        cancelled: "Portfolio discovery cancelled",
        error: runData.error ?? "Portfolio discovery failed",
      };

      if (runData.status === "completed") toast.success(messages.completed);
      else if (runData.status === "cancelled") toast.info(messages.cancelled);
      else toast.error(messages.error);

      // Real-time refresh of sponsor data and companies list
      onPortfolioUpdate?.();
      if (typeof window !== "undefined") {
        localStorage.removeItem("agent_current_run_id");
      }
    }
  }, [
    runData,
    onPortfolioUpdate,
    sponsor.name,
    utils.company,
    utils.sponsor,
    setCurrentRunId,
    setIsAgentRunning,
    setRunData,
  ]);

  const startLiveDiscovery = async (mode: DiscoveryMode) => {
    setIsAgentRunning(true);
    completionToastShown.current = false;

    try {
      const res = await startMutation.mutateAsync({
        sponsorId: sponsor.id,
        mode,
      });

      // Immediately set the run state from the server's response
      setRunData(res);
      setCurrentRunId(res.runId);

      if (typeof window !== "undefined") {
        localStorage.setItem("agent_current_run_id", res.runId);
      }
    } catch (err) {
      console.error(`[UI] Failed to start run`, err);
      setIsAgentRunning(false);
      toast.error("Failed to start portfolio discovery");
    }
  };

  const handleDiscoverPortfolio = () => {
    // If no existing data, skip confirmation and go directly to discovery
    if (
      !portfolioStatus?.hasExistingData ||
      portfolioStatus?.companiesCount === 0
    ) {
      void startLiveDiscovery("append");
    } else {
      setConfirmationDialogOpen(true);
    }
  };

  const handleConfirmDiscovery = (mode: DiscoveryMode) => {
    setConfirmationDialogOpen(false);
    void startLiveDiscovery(mode);
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
