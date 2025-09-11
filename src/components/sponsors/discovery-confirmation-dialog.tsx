"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  IconInfoCircle,
  IconSearch,
  IconRefresh,
  IconPlus,
  IconDatabase,
  IconClock,
  IconSparkles,
  IconLink,
  IconGlobe,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";

export type DiscoveryMode = "append" | "update" | "replace";

interface DiscoveryConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sponsorName: string;
  existingCompaniesCount: number;
  lastDiscoveryDate?: Date;
  portfolioUrl?: string | null;
  onConfirm: (mode: DiscoveryMode) => void;
}

export function DiscoveryConfirmationDialog({
  open,
  onOpenChange,
  sponsorName,
  existingCompaniesCount,
  lastDiscoveryDate,
  portfolioUrl,
  onConfirm,
}: DiscoveryConfirmationDialogProps) {
  const [selectedMode, setSelectedMode] =
    React.useState<DiscoveryMode>("append");

  const formatLastDiscovery = (date: Date) => {
    const now = new Date();
    const diffDays = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (diffDays === 0) return "today";
    if (diffDays === 1) return "yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  const discoveryModes = [
    {
      id: "append" as const,
      title: "Add New Companies",
      description: "Add newly discovered companies alongside existing ones",
      icon: IconPlus,
      risk: "safe",
      details: "Recommended for most cases. Existing data is preserved.",
      badge: "Recommended",
    },
    {
      id: "update" as const,
      title: "Update Existing",
      description: "Refresh data for existing companies and add new ones",
      icon: IconRefresh,
      risk: "medium",
      details:
        "Updates company details but preserves manual edits like description and comments.",
      badge: "Careful",
    },
    {
      id: "replace" as const,
      title: "Complete Replacement",
      description: "Replace all portfolio data with fresh discovery",
      icon: IconDatabase,
      risk: "high",
      details:
        "⚠️ This will permanently delete existing companies, comments, and description.",
      badge: "Destructive",
    },
  ];

  const selectedModeConfig = discoveryModes.find(
    (mode) => mode.id === selectedMode,
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {portfolioUrl ? (
              <IconLink className="size-5 text-green-500" />
            ) : (
              <IconSearch className="size-5 text-blue-500" />
            )}
            Portfolio Discovery for {sponsorName}
          </DialogTitle>
          <DialogDescription>
            <span className="flex items-center gap-2">
              <IconInfoCircle className="size-4" />
              This sponsor already has{" "}
              <Badge variant="secondary" className="text-xs">
                {existingCompaniesCount} companies
              </Badge>
              {lastDiscoveryDate && (
                <>
                  , last discovered{" "}
                  <Badge variant="outline" className="text-xs">
                    <IconClock className="mr-1 size-3" />
                    {formatLastDiscovery(lastDiscoveryDate)}
                  </Badge>
                </>
              )}
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Dynamic info section based on portfolio URL */}
          {portfolioUrl ? (
            <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950/20">
              <div className="flex items-start gap-3">
                <IconLink className="mt-0.5 size-5 flex-shrink-0 text-green-600 dark:text-green-400" />
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-green-900 dark:text-green-100">
                      Using provided portfolio URL
                    </h4>
                    <Badge
                      variant="secondary"
                      className="bg-green-100 text-xs text-green-700 dark:bg-green-900 dark:text-green-300"
                    >
                      Direct Access
                    </Badge>
                  </div>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    We&apos;ll use the direct link to {sponsorName}&apos;s
                    portfolio page instead of searching the web.
                  </p>
                  <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400">
                    <IconGlobe className="size-3" />
                    <a
                      href={portfolioUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline hover:text-green-800 dark:hover:text-green-200"
                    >
                      {portfolioUrl}
                    </a>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950/20">
              <div className="flex items-start gap-3">
                <IconSearch className="mt-0.5 size-5 flex-shrink-0 text-blue-600 dark:text-blue-400" />
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-blue-900 dark:text-blue-100">
                      Web search discovery
                    </h4>
                    <Badge
                      variant="secondary"
                      className="bg-blue-100 text-xs text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                    >
                      AI Search
                    </Badge>
                  </div>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    We&apos;ll search the web to find {sponsorName}&apos;s
                    portfolio companies and investment details.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <h4 className="text-sm font-medium">
              Choose how to handle the discovery:
            </h4>

            {discoveryModes.map((mode) => {
              const Icon = mode.icon;
              const isSelected = selectedMode === mode.id;

              return (
                <div
                  key={mode.id}
                  className={cn(
                    "cursor-pointer rounded-lg border p-4 transition-all",
                    isSelected && "border-primary bg-primary/5",
                    !isSelected && "hover:bg-muted/50",
                    mode.risk === "high" &&
                      isSelected &&
                      "border-red-500 bg-red-50 dark:bg-red-950/20",
                  )}
                  onClick={() => setSelectedMode(mode.id)}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        "flex-shrink-0 rounded-full p-2",
                        isSelected &&
                          mode.risk === "safe" &&
                          "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
                        isSelected &&
                          mode.risk === "medium" &&
                          "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
                        isSelected &&
                          mode.risk === "high" &&
                          "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
                        !isSelected && "bg-muted text-muted-foreground",
                      )}
                    >
                      <Icon className="size-4" />
                    </div>

                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <h5 className="font-medium">{mode.title}</h5>
                        <Badge
                          variant={
                            mode.risk === "safe"
                              ? "default"
                              : mode.risk === "medium"
                                ? "secondary"
                                : "destructive"
                          }
                          className="text-xs"
                        >
                          {mode.badge}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground text-sm">
                        {mode.description}
                      </p>
                      <p className="text-muted-foreground mt-2 text-xs">
                        {mode.details}
                      </p>
                    </div>

                    <div
                      className={cn(
                        "h-4 w-4 flex-shrink-0 rounded-full border-2 transition-colors",
                        isSelected
                          ? "border-primary bg-primary"
                          : "border-muted-foreground",
                      )}
                    >
                      {isSelected && (
                        <div className="h-full w-full scale-50 rounded-full bg-white" />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <Separator />

          {/* Preview of selected action */}
          <div className="bg-muted/50 rounded-lg p-3">
            <div className="mb-2 flex items-center gap-2 text-sm font-medium">
              <IconSparkles className="size-4 text-yellow-500" />
              What will happen:
            </div>
            <div className="text-muted-foreground text-sm">
              {selectedMode === "append" && (
                <ul className="space-y-1">
                  <li>
                    •{" "}
                    {portfolioUrl
                      ? "AI will extract companies from the provided URL"
                      : "AI will search for new portfolio companies"}
                  </li>
                  <li>
                    • New companies will be added to the existing{" "}
                    {existingCompaniesCount}
                  </li>
                  <li>
                    • All existing data, comments, and description are preserved
                  </li>
                  <li>• Duplicate detection will prevent redundancy</li>
                </ul>
              )}
              {selectedMode === "update" && (
                <ul className="space-y-1">
                  <li>
                    •{" "}
                    {portfolioUrl
                      ? "AI will extract all companies from the provided URL"
                      : "AI will search for all portfolio companies"}
                  </li>
                  <li>
                    • Existing companies will have their basic data refreshed
                  </li>
                  <li>• Manual description and comments are preserved</li>
                  <li>• New companies will be added if discovered</li>
                </ul>
              )}
              {selectedMode === "replace" && (
                <ul className="space-y-1">
                  <li>
                    •{" "}
                    {portfolioUrl
                      ? "AI will extract all companies from the provided URL"
                      : "AI will search for all portfolio companies"}
                  </li>
                  <li>
                    • All existing {existingCompaniesCount} companies will be
                    deleted
                  </li>
                  <li>• All comments and description will be lost</li>
                  <li>• Fresh portfolio data will be created from scratch</li>
                </ul>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => onConfirm(selectedMode)}
            variant={
              selectedModeConfig?.risk === "high" ? "destructive" : "default"
            }
          >
            {selectedMode === "append" && "Add New Companies"}
            {selectedMode === "update" && "Update Portfolio"}
            {selectedMode === "replace" && "Replace All Data"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
