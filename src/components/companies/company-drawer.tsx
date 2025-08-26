"use client";

import * as React from "react";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export type CompanyDetail = {
  company: string;
  sponsor: string;
  dateInvested?: string;
  sector?: string;
  size?: string;
  score?: number;
  signals?: string[];
  status?: string;
  webpage?: string;
  note?: string;
};

export function CompanyDrawer(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: CompanyDetail | null;
}) {
  const { open, onOpenChange, data } = props;

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction={"right"}>
      <DrawerContent className="w-full max-w-xl">
        <DrawerHeader>
          <DrawerTitle className="text-left">
            {data?.company ?? "Company"}
          </DrawerTitle>
          <DrawerDescription className="text-left">
            {data?.sponsor ? `Sponsor: ${data.sponsor}` : ""}
          </DrawerDescription>
        </DrawerHeader>

        <div className="flex flex-col gap-4 px-4 pb-4 text-sm">
          <div className="grid grid-cols-2 gap-3">
            <Info label="Invested" value={data?.dateInvested ?? "-"} />
            <Info label="Sector" value={data?.sector ?? "-"} />
            <Info label="Size" value={data?.size ?? "-"} />
            <Info label="Status" value={data?.status ?? "-"} />
          </div>
          <div>
            <div className="mb-1 font-medium">Signals</div>
            <div className="flex flex-wrap gap-2">
              {(data?.signals ?? []).length === 0 ? (
                <span className="text-muted-foreground">No signals</span>
              ) : (
                (data?.signals ?? []).map((s) => (
                  <Badge key={s} variant="outline">
                    {s}
                  </Badge>
                ))
              )}
            </div>
          </div>
          <Separator />
          <div className="space-y-1">
            <div className="font-medium">Notes</div>
            <p className="text-muted-foreground whitespace-pre-wrap">
              {data?.note ?? "-"}
            </p>
          </div>
          {data?.webpage && (
            <div>
              <a
                className="text-blue-600 hover:underline"
                href={data.webpage}
                target="_blank"
                rel="noreferrer"
              >
                Source link
              </a>
            </div>
          )}
        </div>

        <DrawerFooter>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="default">
              Add to watchlist
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Close
            </Button>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col">
      <span className="text-muted-foreground text-xs">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
