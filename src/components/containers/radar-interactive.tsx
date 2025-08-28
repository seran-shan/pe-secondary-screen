"use client";

import { useState } from "react";
import { type RouterOutputs } from "@/trpc/react";
import { RunAgentForm } from "@/components/forms/run-agent-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PipelineStepper } from "@/components/pipeline/pipeline-stepper";

type RunResult = RouterOutputs["agent"]["run"];

export function SecondaryInteractive(props: { defaultSponsor?: string }) {
  const [result, setResult] = useState<RunResult | null>(null);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Run Exit Radar</CardTitle>
        </CardHeader>
        <CardContent>
          <RunAgentForm
            onCompleted={setResult}
            defaultSponsor={props.defaultSponsor}
          />
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
              <ul className="list-disc space-y-1 pl-6">
                {result.portfolioUrls.map((u) => (
                  <li key={u}>
                    <a
                      className="text-blue-600 hover:underline"
                      href={u}
                      target="_blank"
                      rel="noreferrer"
                    >
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
