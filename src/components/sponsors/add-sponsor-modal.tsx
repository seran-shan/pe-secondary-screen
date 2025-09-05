"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { SponsorSchema } from "@/lib/schemas";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  IconLoader2,
  IconAlertTriangle,
  IconPlus,
  IconBuilding,
} from "@tabler/icons-react";
import { api } from "@/trpc/react";

const addSponsorSchema = SponsorSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  name: SponsorSchema.shape.name
    .min(2, "Sponsor name must be at least 2 characters")
    .max(100, "Sponsor name must be less than 100 characters")
    .regex(
      /^[\p{L}\p{N}\s&\-\.,()]+$/u,
      "Sponsor name contains invalid characters",
    ),
  contact: z
    .string()
    .email("Invalid email address")
    .optional()
    .or(z.literal("")),
  portfolioUrl: z
    .string()
    .url("Invalid URL")
    .max(512, "URL must be less than 512 characters")
    .optional()
    .or(z.literal("")),
  description: z
    .string()
    .max(500, "Description must be less than 500 characters")
    .optional(),
  forceCreate: z.boolean(),
});

type AddSponsorFormData = z.infer<typeof addSponsorSchema>;

interface AddSponsorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddSponsorModal({ open, onOpenChange }: AddSponsorModalProps) {
  const router = useRouter();
  const utils = api.useUtils();
  const [showSimilarSponsors, setShowSimilarSponsors] = React.useState(false);
  const [pendingFormData, setPendingFormData] =
    React.useState<AddSponsorFormData | null>(null);

  const form = useForm<AddSponsorFormData>({
    resolver: zodResolver(addSponsorSchema),
    defaultValues: {
      name: "",
      contact: "",
      portfolioUrl: "",
      description: "",
      forceCreate: false,
    },
  });

  const sponsorName = form.watch("name");

  // Only fetch similar sponsors when explicitly requested (after conflict)
  const similarSponsorsQuery = api.sponsor.findSimilar.useQuery(
    { name: sponsorName },
    {
      enabled: false,
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
  );

  const similarSponsors = similarSponsorsQuery.data;

  const createSponsorMutation = api.sponsor.create.useMutation({
    onSuccess: (newSponsor) => {
      // Reset form state
      form.reset();
      setShowSimilarSponsors(false);
      setPendingFormData(null);

      // Close modal
      onOpenChange(false);

      void utils.sponsor.getAll.invalidate();
      void utils.company.getAll.invalidate();

      // Navigate to new sponsor page
      router.push(`/sponsors/${newSponsor.id}`);
    },
    onError: (error) => {
      if (error.data?.code === "CONFLICT") {
        // Show similar sponsors warning
        setPendingFormData(form.getValues());
        setShowSimilarSponsors(true);
        // Fetch similar sponsors only now
        void similarSponsorsQuery.refetch();
      } else {
        // Other errors will be handled by the form
        console.error("Error creating sponsor:", error);
      }
    },
  });

  const handleSubmit = (data: AddSponsorFormData) => {
    createSponsorMutation.mutate(data);
  };

  const handleForceCreate = () => {
    if (pendingFormData) {
      createSponsorMutation.mutate({
        ...pendingFormData,
        forceCreate: true,
      });
    }
  };

  const handleSelectExistingSponsor = (sponsorId: string) => {
    // Reset form and navigate to existing sponsor
    form.reset();
    setShowSimilarSponsors(false);
    setPendingFormData(null);
    onOpenChange(false);
    router.push(`/sponsors/${sponsorId}`);
  };

  const handleCloseModal = () => {
    form.reset();
    setShowSimilarSponsors(false);
    setPendingFormData(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleCloseModal}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <IconBuilding className="size-5" />
            Add New Sponsor
          </DialogTitle>
          <DialogDescription>
            Create a new sponsor to start tracking their portfolio companies and
            investments.
          </DialogDescription>
        </DialogHeader>

        {showSimilarSponsors &&
        similarSponsors &&
        similarSponsors.length > 0 ? (
          <div className="space-y-4">
            <Alert>
              <IconAlertTriangle className="size-4" />
              <AlertTitle>Similar sponsors found</AlertTitle>
              <AlertDescription>
                We found sponsors with similar names. Please review them before
                creating a new one.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              {similarSponsors.map((sponsor) => (
                <div
                  key={sponsor.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <div className="font-medium">{sponsor.name}</div>
                    {sponsor.contact && (
                      <div className="text-muted-foreground text-sm">
                        {sponsor.contact}
                      </div>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSelectExistingSponsor(sponsor.id)}
                  >
                    Use this one
                  </Button>
                </div>
              ))}
            </div>

            <DialogFooter className="flex-col gap-2 sm:flex-row">
              <Button
                variant="outline"
                onClick={() => setShowSimilarSponsors(false)}
                className="w-full sm:w-auto"
              >
                Back to form
              </Button>
              <Button
                onClick={handleForceCreate}
                disabled={createSponsorMutation.isPending}
                className="w-full sm:w-auto"
              >
                {createSponsorMutation.isPending && (
                  <IconLoader2 className="mr-2 size-4 animate-spin" />
                )}
                Create anyway
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sponsor Name *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Acme Capital Partners"
                        {...field}
                        disabled={createSponsorMutation.isPending}
                      />
                    </FormControl>
                    <FormDescription>
                      The official name of the investment firm or sponsor.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="portfolioUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Portfolio URL</FormLabel>
                    <FormControl>
                      <Input
                        type="url"
                        placeholder="https://acmecapital.com/portfolio"
                        {...field}
                        disabled={createSponsorMutation.isPending}
                      />
                    </FormControl>
                    <FormDescription>
                      Direct link to portfolio/companies page. We&apos;ll use
                      this instead of searching.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contact"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="contact@acmecapital.com"
                        {...field}
                        disabled={createSponsorMutation.isPending}
                      />
                    </FormControl>
                    <FormDescription>
                      Primary contact email for this sponsor (optional).
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Initial Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Any initial description about this sponsor..."
                        className="resize-none"
                        rows={3}
                        {...field}
                        disabled={createSponsorMutation.isPending}
                      />
                    </FormControl>
                    <FormDescription>
                      Optional description about the sponsor, investment focus,
                      etc.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {createSponsorMutation.error && (
                <Alert variant="destructive">
                  <IconAlertTriangle className="size-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>
                    {createSponsorMutation.error.message}
                  </AlertDescription>
                </Alert>
              )}

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloseModal}
                  disabled={createSponsorMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createSponsorMutation.isPending}
                >
                  {createSponsorMutation.isPending && (
                    <IconLoader2 className="mr-2 size-4 animate-spin" />
                  )}
                  <IconPlus className="mr-2 size-4" />
                  Create Sponsor
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
