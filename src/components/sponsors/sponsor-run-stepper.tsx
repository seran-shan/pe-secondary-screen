"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { IconCheck, IconX, IconClock, IconLoader2 } from "@tabler/icons-react";
import { defineStepper } from "@/components/stepper";
import { type RunState } from "@/server/agents/run-registry";

const ORDER = [
  "finder",
  "extractor",
  "normalizer",
  "enricher",
  "writer",
] as const;

type StepId = (typeof ORDER)[number];

const LABEL: Record<string, string> = {
  finder: "Finding URLs",
  extractor: "AI Extraction",
  normalizer: "Normalizing Data",
  enricher: "Enriching Details",
  writer: "Saving Results",
};

const DESCRIPTION: Record<string, string> = {
  finder: "Discovering portfolio company URLs",
  extractor: "Extracting data using AI",
  normalizer: "Standardizing extracted data",
  enricher: "Adding missing details and determining status",
  writer: "Saving results to database",
};

// Define the stepper with our pipeline steps
const AgentStepper = defineStepper(
  { id: "finder", title: "Finder" },
  { id: "extractor", title: "Extractor" },
  { id: "normalizer", title: "Normalizer" },
  { id: "enricher", title: "Enricher" },
  { id: "writer", title: "Writer" },
);

export function SponsorRunStepper({ run }: { run: RunState }) {
  // Determine current step based on run status
  const getCurrentStep = () => {
    if (!run) return "finder";

    const completedSteps = ORDER.filter(
      (stepId) => run.steps?.[stepId]?.status === "completed",
    );

    const runningStep = ORDER.find(
      (stepId) => run.steps?.[stepId]?.status === "running",
    );

    if (runningStep) return runningStep;
    if (completedSteps.length === ORDER.length) return "writer";
    if (completedSteps.length === 0) return "finder";

    // Return the next step after the last completed one
    const lastCompletedStep = completedSteps[completedSteps.length - 1];
    if (!lastCompletedStep) return "finder";
    const lastCompletedIndex = ORDER.indexOf(lastCompletedStep);
    return ORDER[lastCompletedIndex + 1] ?? "finder";
  };

  const getStepStatus = (stepId: StepId) => {
    if (!run) return "pending";
    return run.steps?.[stepId]?.status ?? "pending";
  };

  const getStepIcon = (stepId: StepId, status: string) => {
    if (status === "completed") {
      return <IconCheck className="size-4 text-green-600" />;
    } else if (status === "running") {
      return <IconLoader2 className="text-primary size-4 animate-spin" />;
    } else if (status === "error") {
      return <IconX className="text-destructive size-4" />;
    } else {
      return <IconClock className="text-muted-foreground size-4" />;
    }
  };

  const currentStep = getCurrentStep();
  const done = ORDER.filter(
    (stepId) => getStepStatus(stepId) === "completed",
  ).length;
  const percent = Math.round((done / ORDER.length) * 100);

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <div className="text-sm font-medium">Discovery Progress</div>
          <div className="text-muted-foreground text-xs">
            {percent}% Complete
          </div>
        </div>

        <AgentStepper.Stepper.Provider
          initialStep={currentStep}
          variant="horizontal"
          labelOrientation="vertical"
        >
          <AgentStepper.Stepper.Navigation>
            {ORDER.map((stepId) => {
              const status = getStepStatus(stepId);
              const isActive = currentStep === stepId;

              return (
                <AgentStepper.Stepper.Step
                  key={stepId}
                  of={stepId}
                  icon={getStepIcon(stepId, status)}
                  disabled={!isActive && status === "pending"}
                >
                  <AgentStepper.Stepper.Title>
                    {LABEL[stepId]}
                  </AgentStepper.Stepper.Title>
                  <AgentStepper.Stepper.Description>
                    {DESCRIPTION[stepId]}
                  </AgentStepper.Stepper.Description>
                </AgentStepper.Stepper.Step>
              );
            })}
          </AgentStepper.Stepper.Navigation>
        </AgentStepper.Stepper.Provider>

        {/* Progress metrics */}
        <div className="mt-6 flex flex-wrap gap-2 text-xs">
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
