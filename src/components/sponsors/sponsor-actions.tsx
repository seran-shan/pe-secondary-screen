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
  AgentProgressModal,
  AGENT_STEPS,
  type AgentStep,
} from "./agent-progress-modal";
import {
  DiscoveryConfirmationDialog,
  type DiscoveryMode,
} from "./discovery-confirmation-dialog";
import { api } from "@/trpc/react";
import { toast } from "sonner";
import { useSponsors } from "./sponsors-provider";

interface SponsorActionsProps {
  sponsor: {
    id: string;
    name: string;
  };
  onPortfolioUpdate?: () => void;
}

export function SponsorActions({
  sponsor,
  onPortfolioUpdate,
}: SponsorActionsProps) {
  const {
    addOptimisticPortfolioCompanies,
    updateSponsorDiscoveryStatus,
    updateSponsorWithRealData,
  } = useSponsors();
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [confirmationDialogOpen, setConfirmationDialogOpen] =
    React.useState(false);
  const [agentModalOpen, setAgentModalOpen] = React.useState(false);
  const [agentSteps, setAgentSteps] = React.useState<AgentStep[]>([]);
  const [agentStartTime, setAgentStartTime] = React.useState<Date | null>(null);
  const [isAgentRunning, setIsAgentRunning] = React.useState(false);

  // Query to check existing portfolio status - always enabled for button state
  const { data: portfolioStatus } = api.agent.checkPortfolioStatus.useQuery({
    sponsorName: sponsor.name,
  });

  const utils = api.useUtils();

  const agentMutation = api.agent.run.useMutation({
    onMutate: async (_variables) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await utils.agent.checkPortfolioStatus.cancel({
        sponsorName: sponsor.name,
      });

      // Snapshot the previous value
      const previousPortfolioStatus = utils.agent.checkPortfolioStatus.getData({
        sponsorName: sponsor.name,
      });

      // Return a context object with the snapshotted value
      return { previousPortfolioStatus };
    },
    onSuccess: async (result) => {
      // Update final step with completion
      setAgentSteps((prev) =>
        prev.map((step) =>
          step.id === "writer"
            ? { ...step, status: "completed", count: result.enrichedCount }
            : step,
        ),
      );
      setIsAgentRunning(false);
      updateSponsorDiscoveryStatus(sponsor.id, false);

      const modeMessages = {
        append: `Added ${result.enrichedCount} new portfolio companies to ${sponsor.name}`,
        update: `Updated portfolio for ${sponsor.name} with ${result.enrichedCount} companies`,
        replace: `Replaced portfolio for ${sponsor.name} with ${result.enrichedCount} fresh companies`,
      };

      toast.success(modeMessages[currentMode] ?? modeMessages.append);

      // Fetch updated sponsor data and update context
      try {
        const updatedSponsor = await utils.sponsor.getByIdWithPortfolio.fetch({
          id: sponsor.id,
        });

        if (updatedSponsor) {
          updateSponsorWithRealData(sponsor.id, updatedSponsor);
        }
      } catch (error) {
        console.error("Failed to fetch updated sponsor data:", error);
        // Fallback to refresh if fetch fails
        if (onPortfolioUpdate) {
          onPortfolioUpdate();
        }
      }

      // Invalidate portfolio status query
      void utils.agent.checkPortfolioStatus.invalidate({
        sponsorName: sponsor.name,
      });
    },
    onError: (error, variables, context) => {
      // Mark current running step as error
      setAgentSteps((prev) =>
        prev.map((step) =>
          step.status === "running"
            ? { ...step, status: "error", error: error.message }
            : step,
        ),
      );
      setIsAgentRunning(false);
      updateSponsorDiscoveryStatus(sponsor.id, false);

      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousPortfolioStatus) {
        utils.agent.checkPortfolioStatus.setData(
          { sponsorName: sponsor.name },
          context.previousPortfolioStatus,
        );
      }

      toast.error(`Failed to discover portfolio companies: ${error.message}`);
    },
    onSettled: () => {
      // Always refetch after error or success to sync with server state
      void utils.agent.checkPortfolioStatus.invalidate({
        sponsorName: sponsor.name,
      });
    },
  });

  const initializeAgentSteps = (): AgentStep[] => {
    return AGENT_STEPS.map((stepTemplate) => ({
      ...stepTemplate,
      status: "pending" as const,
    }));
  };

  const simulateAgentProgress = async () => {
    const steps = initializeAgentSteps();
    setAgentSteps(steps);
    setAgentStartTime(new Date());
    setIsAgentRunning(true);
    setAgentModalOpen(true);

    // Mark sponsor as having discovery in progress
    updateSponsorDiscoveryStatus(sponsor.id, true);

    // Simulate step-by-step progress
    for (let i = 0; i < steps.length - 1; i++) {
      // -1 because writer step is handled by mutation
      const currentStep = steps[i];
      if (!currentStep) continue;

      // Mark current step as running (and ensure no other step is running)
      setAgentSteps((prev) =>
        prev.map((step) => ({
          ...step,
          status:
            step.id === currentStep.id
              ? "running"
              : step.status === "running"
                ? "pending"
                : step.status,
        })),
      );

      // Simulate processing time
      await new Promise(
        (resolve) => setTimeout(resolve, 1500 + Math.random() * 1500), // Slightly longer for better UX
      );

      // Mark as completed with simulated count
      const count = Math.floor(Math.random() * 8) + 3; // 3-10 items
      setAgentSteps((prev) =>
        prev.map((step) =>
          step.id === currentStep.id
            ? { ...step, status: "completed", count }
            : step,
        ),
      );

      // Add optimistic portfolio companies progressively during extraction step
      if (currentStep.id === "extractor") {
        // Generate mock companies that are being "discovered"
        const mockCompanies = Array.from({ length: count }, (_, index) => ({
          asset: `Discovering Company ${index + 1}`,
          fsnSector: [
            "Technology",
            "Healthcare",
            "Finance",
            "Energy",
            "Consumer",
          ][Math.floor(Math.random() * 5)],
          webpage: `https://example${index + 1}.com`,
          dateInvested: new Date(
            Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000,
          )
            .toISOString()
            .split("T")[0], // Random date in last year
        }));

        // Add optimistic companies
        addOptimisticPortfolioCompanies(sponsor.id, mockCompanies, currentMode);
      }
    }

    // Mark writer step as running before actual API call (ensure only writer is running)
    setAgentSteps((prev) =>
      prev.map((step) => ({
        ...step,
        status:
          step.id === "writer"
            ? "running"
            : step.status === "running"
              ? "completed"
              : step.status,
      })),
    );

    // Start the actual agent with mode
    agentMutation.mutate({
      sponsorName: sponsor.name,
      mode: currentMode,
    });
  };

  const [currentMode, setCurrentMode] = React.useState<DiscoveryMode>("append");

  const simulateAgentProgressWithMode = async (mode: DiscoveryMode) => {
    setCurrentMode(mode);
    await simulateAgentProgress();
  };

  const handleDiscoverPortfolio = () => {
    // If no existing data, skip confirmation and go directly to discovery
    if (
      !portfolioStatus?.hasExistingData ||
      portfolioStatus?.companiesCount === 0
    ) {
      void simulateAgentProgressWithMode("append");
    } else {
      setConfirmationDialogOpen(true);
    }
  };

  const handleConfirmDiscovery = (mode: DiscoveryMode) => {
    setConfirmationDialogOpen(false);
    void simulateAgentProgressWithMode(mode);
  };

  const handleCancelAgent = () => {
    setIsAgentRunning(false);
    setAgentModalOpen(false);
    setAgentSteps([]);
    setAgentStartTime(null);
    updateSponsorDiscoveryStatus(sponsor.id, false);
    toast.info("Portfolio discovery cancelled");
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
          disabled={isAgentRunning}
          size="lg"
          className="relative"
        >
          {isAgentRunning ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              <span className="hidden sm:inline">Discovering...</span>
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
        startTime={agentStartTime || undefined}
        discoveryMode={currentMode}
      />

      <DiscoveryConfirmationDialog
        open={confirmationDialogOpen}
        onOpenChange={setConfirmationDialogOpen}
        sponsorName={sponsor.name}
        existingCompaniesCount={portfolioStatus?.companiesCount ?? 0}
        lastDiscoveryDate={portfolioStatus?.lastDiscoveryDate ?? undefined}
        onConfirm={handleConfirmDiscovery}
      />
    </>
  );
}
