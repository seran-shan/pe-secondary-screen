"use client";

import * as React from "react";
import { z } from "zod";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCompanyDrawer } from "./company-drawer-context";

const CompanySchema = z.object({
  company: z.string(),
  sponsor: z.string(),
  dateInvested: z.string().optional(),
  sector: z.string().optional(),
  size: z.string().optional(),
  score: z.number().optional(),
  signals: z.array(z.string()).optional(),
  status: z.string().optional(),
}) satisfies z.ZodType;

export type CompanyRow = z.infer<typeof CompanySchema>;

export function CompaniesTable(props: { data: CompanyRow[] }) {
  // Validate incoming data with Zod schema
  const validatedData = React.useMemo(() => {
    return props.data.filter((item) => {
      const result = CompanySchema.safeParse(item);
      if (!result.success) {
        console.warn("Invalid company data:", item, result.error);
        return false;
      }
      return true;
    });
  }, [props.data]);

  const [query, setQuery] = React.useState("");
  const [sector, setSector] = React.useState<string | undefined>(undefined);
  const { openCompanyDrawer } = useCompanyDrawer();

  const sectors = React.useMemo(() => {
    const s = new Set<string>();
    validatedData.forEach((r) => r.sector && s.add(r.sector));
    return Array.from(s).sort();
  }, [validatedData]);

  const filtered = validatedData.filter((r) => {
    const q = query.trim().toLowerCase();
    const matchesQuery =
      !q ||
      r.company.toLowerCase().includes(q) ||
      r.sponsor.toLowerCase().includes(q);
    const matchesSector = !sector || r.sector === sector;
    return matchesQuery && matchesSector;
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Companies</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-3 md:flex-row">
          <Input
            placeholder="Search company or sponsor"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <Select value={sector} onValueChange={(v) => setSector(v)}>
            <SelectTrigger className="md:w-56">
              <SelectValue placeholder="Sector" />
            </SelectTrigger>
            <SelectContent>
              {sectors.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company</TableHead>
                <TableHead>Sponsor</TableHead>
                <TableHead>Invested</TableHead>
                <TableHead>Sector</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Signals</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center">
                    No companies.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((r) => (
                  <TableRow
                    key={`${r.sponsor}-${r.company}`}
                    className="cursor-pointer"
                    onClick={() => {
                      openCompanyDrawer({
                        id: `${r.sponsor}-${r.company}`, // Generate a simple ID
                        company: r.company,
                        sponsor: r.sponsor,
                        dateInvested: r.dateInvested,
                        sector: r.sector,
                        size: r.size,
                        score: r.score,
                        signals: r.signals,
                        status: r.status,
                      });
                    }}
                  >
                    <TableCell className="font-medium">{r.company}</TableCell>
                    <TableCell>{r.sponsor}</TableCell>
                    <TableCell>{r.dateInvested ?? "-"}</TableCell>
                    <TableCell>{r.sector ?? "-"}</TableCell>
                    <TableCell>
                      {typeof r.score === "number" ? r.score.toFixed(0) : "-"}
                    </TableCell>
                    <TableCell className="space-x-1">
                      {(r.signals ?? []).map((s) => (
                        <Badge key={s} variant="outline">
                          {s}
                        </Badge>
                      ))}
                    </TableCell>
                    <TableCell>{r.status ?? "-"}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
