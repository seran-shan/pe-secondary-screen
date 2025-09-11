"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { AddSponsorModal } from "./add-sponsor-modal";
import { IconPlus } from "@tabler/icons-react";

export function AddSponsorButton() {
  const [addModalOpen, setAddModalOpen] = React.useState(false);

  return (
    <>
      <Button
        onClick={() => setAddModalOpen(true)}
        className="hover:shadow-primary/25 hover:bg-primary/90 gap-2 transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-lg active:scale-95"
      >
        <IconPlus className="size-4 transition-transform duration-300 group-hover:rotate-90" />
        Add Sponsor
      </Button>

      <AddSponsorModal open={addModalOpen} onOpenChange={setAddModalOpen} />
    </>
  );
}
