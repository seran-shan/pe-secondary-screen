"use client";

import { useState } from "react";
import { type RouterOutputs } from "@/trpc/react";
import { RunAgentForm } from "@/components/forms/run-agent-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PipelineStepper } from "@/components/pipeline/pipeline-stepper";

type RunResult = RouterOutputs["agent"]["run"];

export function SecondaryInteractive() {
  const [result, setResult] = useState<RunResult | null>(null);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Run Exit Radar</CardTitle>
        </CardHeader>
        <CardContent>
          <RunAgentForm onCompleted={setResult} />
        </CardContent>
      </Card>

      {result && (
        <div className="grid grid-cols-1 gap-4">
          <PipelineStepper data={result} />
          <Card>
            <CardHeader>
              <CardTitle>Portfolio Sources</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc pl-6 space-y-1">
                {result.portfolioUrls.map((u) => (
                  <li key={u}>
                    <a className="text-blue-600 hover:underline" href={u} target="_blank" rel="noreferrer">
                      {u}
                    </a>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}


