"use client";

import { Button } from "@/components/ui/button";
import { ExternalLink, BarChart3 } from "lucide-react";
import { env } from "@/env";

interface LangSmithLinkProps {
  runId?: string;
  projectName?: string;
  className?: string;
}

export function LangSmithLink({
  runId,
  projectName,
  className,
}: LangSmithLinkProps) {
  // Only show if LangSmith is configured
  if (!process.env.NEXT_PUBLIC_LANGSMITH_ENDPOINT) {
    return null;
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_LANGSMITH_ENDPOINT || "https://smith.langchain.com";
  const project = projectName || "pe-secondary-screen";

  const projectUrl = `${baseUrl}/o/${project}`;
  const runUrl = runId ? `${baseUrl}/o/${project}/r/${runId}` : projectUrl;

  return (
    <div className={`flex gap-2 ${className}`}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => window.open(projectUrl, "_blank")}
        className="flex items-center gap-2"
      >
        <BarChart3 className="h-4 w-4" />
        View Traces
        <ExternalLink className="h-3 w-3" />
      </Button>

      {runId && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.open(runUrl, "_blank")}
          className="flex items-center gap-2"
        >
          <BarChart3 className="h-4 w-4" />
          View Run
          <ExternalLink className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}
