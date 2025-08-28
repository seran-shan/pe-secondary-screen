"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

type LegacySponsors = {
  sponsors: Array<{
    name: string;
    contact?: string | null;
    portfolio?: Array<{
      asset?: string;
      webpage?: string;
      dateInvested?: string;
      fsnSector?: string;
      note?: string;
    }>;
  }>;
};

export function SponsorsImport() {
  const [fileName, setFileName] = React.useState<string>("");
  const [summary, setSummary] = React.useState<
    Array<{ name: string; portcos: number; sectors: string[] }>
  >([]);
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const text = await file.text();
    try {
      const json = JSON.parse(text) as LegacySponsors;
      const next = (json.sponsors ?? []).map((s) => {
        const sectors = new Set<string>();
        (s.portfolio ?? []).forEach((p) => {
          if (p.fsnSector) sectors.add(p.fsnSector);
        });
        return {
          name: s.name,
          portcos: s.portfolio?.length ?? 0,
          sectors: Array.from(sectors).sort(),
        };
      });
      setSummary(next);
    } catch (err) {
      console.error(err);
      setSummary([]);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Import legacy JSON</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-3 md:flex-row">
          <Input
            ref={inputRef}
            type="file"
            accept="application/json"
            onChange={handleFile}
          />
          <Button variant="outline" onClick={() => inputRef.current?.click()}>
            Choose file
          </Button>
        </div>
        {fileName && (
          <div className="text-muted-foreground text-sm">
            Loaded: {fileName}
          </div>
        )}

        {summary.length > 0 && (
          <div className="overflow-hidden rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">Sponsor</th>
                  <th className="px-3 py-2 text-left font-medium">Portcos</th>
                  <th className="px-3 py-2 text-left font-medium">Sectors</th>
                </tr>
              </thead>
              <tbody>
                {summary.map((s) => (
                  <tr key={s.name} className="border-t">
                    <td className="px-3 py-2 font-medium">{s.name}</td>
                    <td className="px-3 py-2">{s.portcos}</td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap gap-1">
                        {s.sectors.map((sec) => (
                          <Badge key={sec} variant="outline">
                            {sec}
                          </Badge>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
