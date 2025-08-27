"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { AddSponsorModal } from "./add-sponsor-modal";
import { IconPlus } from "@tabler/icons-react";

interface SponsorsHeaderProps {
  title: string;
  description: string;
}

export function SponsorsHeader({ title, description }: SponsorsHeaderProps) {
  const [addModalOpen, setAddModalOpen] = React.useState(false);

  return (
    <>
      <div className="flex items-start justify-between">
        <Heading title={title} description={description} />
        <Button onClick={() => setAddModalOpen(true)} className="gap-2">
          <IconPlus className="size-4" />
          Add Sponsor
        </Button>
      </div>

      <AddSponsorModal open={addModalOpen} onOpenChange={setAddModalOpen} />
    </>
  );
}
