"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { IconAlertTriangle, IconLoader2, IconTrash } from "@tabler/icons-react";
import { api } from "@/trpc/react";

interface DeleteSponsorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sponsor: {
    id: string;
    name: string;
  };
}

export function DeleteSponsorDialog({
  open,
  onOpenChange,
  sponsor,
}: DeleteSponsorDialogProps) {
  const router = useRouter();

  const deleteSponsorMutation = api.sponsor.delete.useMutation({
    onSuccess: () => {
      onOpenChange(false);
      // Navigate back to sponsors list
      router.push("/workspace/sponsors");
      // The page will automatically refetch when we navigate
    },
    onError: (error) => {
      // Error will be shown in the dialog
      console.error("Failed to delete sponsor:", error);
    },
  });

  const handleDelete = () => {
    deleteSponsorMutation.mutate({ id: sponsor.id });
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <IconTrash className="text-destructive size-5" />
            Delete Sponsor
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete <strong>{sponsor.name}</strong>?
            This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        {deleteSponsorMutation.error && (
          <Alert variant="destructive">
            <IconAlertTriangle className="size-4" />
            <AlertTitle>Cannot Delete Sponsor</AlertTitle>
            <AlertDescription>
              {deleteSponsorMutation.error.message}
            </AlertDescription>
          </Alert>
        )}

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={deleteSponsorMutation.isPending}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteSponsorMutation.isPending}
            className="w-full sm:w-auto"
          >
            {deleteSponsorMutation.isPending && (
              <IconLoader2 className="mr-2 size-4 animate-spin" />
            )}
            <IconTrash className="mr-2 size-4" />
            Delete Sponsor
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
