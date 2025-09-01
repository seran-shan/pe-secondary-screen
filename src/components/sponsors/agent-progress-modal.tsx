"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  IconSearch,
  IconBrain,
  IconAdjustments,
  IconSparkles,
  IconDatabase,
  IconCheck,
  IconClock,
  IconX,
  IconAlertTriangle,
  IconLink,
} from "@tabler/icons-react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type AgentStep = {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  status: "pending" | "running" | "completed" | "error";
  count?: number;
  error?: string;
};

const getAgentSteps = (portfolioUrl?: string | null) => [
  {
    id: "finder",
    name: portfolioUrl ? "Using Portfolio URL" : "Finding URLs",
    icon: portfolioUrl ? IconLink : IconSearch,
    description: portfolioUrl
      ? "Using provided portfolio page directly"
      : "Searching for portfolio company pages",
  },
  {
    id: "extractor",
    name: "AI Extraction",
    icon: IconBrain,
    description: "Using AI to identify portfolio companies",
  },
  {
    id: "normalizer",
    name: "Normalizing Data",
    icon: IconAdjustments,
    description: "Cleaning and standardizing company data",
  },
  {
    id: "enricher",
    name: "Enriching Details",
    icon: IconSparkles,
    description: "Adding additional company information",
  },
  {
    id: "writer",
    name: "Saving Results",
    icon: IconDatabase,
    description: "Updating portfolio database",
  },
];

interface AgentProgressModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sponsorName: string;
  steps: AgentStep[];
  onCancel?: () => void;
  onComplete?: () => void;
  estimatedTimeMs?: number;
  startTime?: Date;
  discoveryMode?: "append" | "update" | "replace";
  portfolioUrl?: string | null;
}

export function AgentProgressModal({
  open,
  onOpenChange,
  sponsorName,
  steps,
  onCancel,
  onComplete,
  estimatedTimeMs,
  startTime,
  discoveryMode = "append",
  portfolioUrl,
}: AgentProgressModalProps) {
  const [elapsedTime, setElapsedTime] = React.useState(0);

  // Update elapsed time every second
  React.useEffect(() => {
    if (!startTime || !open) return;

    const interval = setInterval(() => {
      setElapsedTime(Date.now() - startTime.getTime());
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime, open]);

  const agentSteps = getAgentSteps(portfolioUrl);
  const completedSteps = steps.filter((step) => step.status === "completed");
  const runningStep = steps.find((step) => step.status === "running");
  const errorStep = steps.find((step) => step.status === "error");
  const isComplete = completedSteps.length === steps.length && !errorStep;
  const hasError = !!errorStep;

  const progressPercentage = Math.round(
    (completedSteps.length / steps.length) * 100,
  );

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${remainingSeconds}s`;
  };

  const getEstimatedTimeRemaining = () => {
    if (!estimatedTimeMs || !startTime || isComplete) return null;

    const avgTimePerStep = elapsedTime / Math.max(completedSteps.length, 1);
    const remainingSteps = steps.length - completedSteps.length;
    const estimated = avgTimePerStep * remainingSteps;

    return Math.max(0, estimated);
  };

  const estimatedRemaining = getEstimatedTimeRemaining();

  const handleClose = () => {
    onOpenChange(false);
    if (isComplete && onComplete) {
      onComplete();
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isComplete ? (
              <IconCheck className="size-5 text-green-500" />
            ) : hasError ? (
              <IconAlertTriangle className="size-5 text-red-500" />
            ) : (
              <IconSearch className="size-5 text-blue-500" />
            )}
            {isComplete
              ? `Discovery Complete for ${sponsorName}`
              : hasError
                ? `Discovery Failed for ${sponsorName}`
                : `Discovering Portfolio for ${sponsorName}`}
            {discoveryMode !== "append" && (
              <span className="text-muted-foreground ml-2 text-sm">
                ({discoveryMode} mode)
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress Overview */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">
                {runningStep ? `${runningStep.name}` : "Progress"}:{" "}
                {completedSteps.length} / {steps.length}
              </span>
              <span className="text-muted-foreground">
                {isComplete ? "Completed" : `${progressPercentage}%`}
              </span>
            </div>
            <Progress value={progressPercentage} className="h-2" />

            {/* Time Information */}
            <div className="text-muted-foreground flex items-center justify-between text-xs">
              <span>Elapsed: {formatTime(elapsedTime)}</span>
              {estimatedRemaining && !isComplete && !hasError && (
                <span>Est. remaining: {formatTime(estimatedRemaining)}</span>
              )}
            </div>
          </div>

          {/* Steps List */}
          <div className="space-y-3">
            {agentSteps.map((stepConfig, index) => {
              const step = steps[index] ?? { status: "pending" as const };
              const Icon = stepConfig.icon;
              return (
                <div
                  key={stepConfig.id}
                  className={cn(
                    "flex items-center gap-3 rounded-lg border p-3 transition-colors",
                    step.status === "completed" &&
                      "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20",
                    step.status === "running" &&
                      "border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/20",
                    step.status === "error" &&
                      "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20",
                    step.status === "pending" && "bg-muted/50",
                  )}
                >
                  <div className="flex-shrink-0">
                    {step.status === "completed" ? (
                      <IconCheck className="size-5 text-green-500" />
                    ) : step.status === "running" ? (
                      <Loader2 className="size-5 animate-spin text-blue-500" />
                    ) : step.status === "error" ? (
                      <IconX className="size-5 text-red-500" />
                    ) : (
                      <IconClock className="text-muted-foreground size-5" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Icon className="text-muted-foreground size-4" />
                      <span className="font-medium">{stepConfig.name}</span>
                      {"count" in step && step.count !== undefined && (
                        <Badge variant="outline" className="text-xs">
                          {step.count}{" "}
                          {stepConfig.id === "finder" ? "URLs" : "items"}
                        </Badge>
                      )}
                    </div>
                    <p className="text-muted-foreground mt-1 text-sm">
                      {"error" in step && step.error
                        ? step.error
                        : stepConfig.description}
                    </p>
                  </div>

                  <div className="flex-shrink-0">
                    <Badge
                      variant={
                        step.status === "completed"
                          ? "default"
                          : step.status === "running"
                            ? "secondary"
                            : step.status === "error"
                              ? "destructive"
                              : "outline"
                      }
                      className="text-xs"
                    >
                      {step.status === "completed"
                        ? "Done"
                        : step.status === "running"
                          ? "Running"
                          : step.status === "error"
                            ? "Error"
                            : "Pending"}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 border-t pt-4">
            {!isComplete && !hasError && onCancel && (
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
            )}
            {(isComplete || hasError) && (
              <Button onClick={handleClose}>
                {isComplete ? "View Results" : "Close"}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
