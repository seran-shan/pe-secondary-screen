"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  IconPlayerPlay,
  IconEdit,
  IconDotsVertical,
  IconDownload,
  IconShare,
  IconTrash,
  IconRefresh,
} from "@tabler/icons-react";

interface SponsorActionsProps {
  sponsor: {
    id: string;
    name: string;
  };
}

export function SponsorActions({ sponsor }: SponsorActionsProps) {
  return (
    <div className="flex items-center gap-2">
      {/* Primary Action - Run Scan */}
      <Button asChild>
        <Link href={`/run?name=${encodeURIComponent(sponsor.name)}`}>
          <IconPlayerPlay className="size-4" />
          Run Scan
        </Link>
      </Button>

      {/* Secondary Action - Refresh Data */}
      <Button variant="outline">
        <IconRefresh className="size-4" />
        <span className="hidden sm:inline">Refresh</span>
      </Button>

      {/* More Actions Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon">
            <IconDotsVertical className="size-4" />
            <span className="sr-only">More actions</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem>
            <IconEdit className="size-4" />
            Edit Sponsor
          </DropdownMenuItem>
          <DropdownMenuItem>
            <IconDownload className="size-4" />
            Export Portfolio
          </DropdownMenuItem>
          <DropdownMenuItem>
            <IconShare className="size-4" />
            Share Report
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive">
            <IconTrash className="size-4" />
            Delete Sponsor
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
