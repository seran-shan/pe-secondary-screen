import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  IconCircleCheckFilled,
  IconDotsVertical,
  IconExternalLink,
} from "@tabler/icons-react";
import type { RouterOutputs } from "@/trpc/react";

type Company = RouterOutputs["company"]["getAll"][0];

interface MobileCompanyCardProps {
  company: Company;
}

export function MobileCompanyCard({ company }: MobileCompanyCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">
            {company.asset}
          </CardTitle>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="data-[state=open]:bg-muted text-muted-foreground flex size-8"
                size="icon"
              >
                <IconDotsVertical />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-32">
              <DropdownMenuItem>View</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive">Remove</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <Badge variant="outline" className="text-muted-foreground w-fit px-1.5">
          {company.sponsor.name}
        </Badge>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-muted-foreground text-sm">Invested</p>
          <p>{company.dateInvested?.toLocaleDateString() ?? "-"}</p>
        </div>
        <div>
          <p className="text-muted-foreground text-sm">Sector</p>
          <p className="truncate">{company.sector ?? "-"}</p>
        </div>
        <div>
          <p className="text-muted-foreground text-sm">Location</p>
          <p className="truncate">{company.location ?? "-"}</p>
        </div>
        <div>
          <p className="text-muted-foreground text-sm">Status</p>
          <Badge variant="outline" className="px-2 py-1">
            {company.status === "EXITED" ? (
              <span className="relative mr-2 inline-block size-2 rounded-full bg-rose-500" />
            ) : (
              <IconCircleCheckFilled className="mr-2 size-4 fill-emerald-500" />
            )}
            {company.status === "ACTIVE" ? "Active" : "Exited"}
          </Badge>
        </div>
        <div>
          <p className="text-muted-foreground text-sm">Source</p>
          {company.webpage ? (
            <a
              href={company.webpage}
              target="_blank"
              rel="noreferrer"
              className="text-foreground inline-flex items-center gap-1 hover:text-blue-600"
              aria-label="Open source link"
            >
              <IconExternalLink className="size-4" />
              Link
            </a>
          ) : (
            <span className="text-muted-foreground">-</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
