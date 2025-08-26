"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { api, type RouterOutputs } from "@/trpc/react";
import { Button } from "@/components/ui/button";
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

type RunResult = RouterOutputs["agent"]["run"];

const FormSchema = z.object({
  sponsorName: z
    .string()
    .min(2, { message: "Sponsor name must be at least 2 characters." })
    .max(100, { message: "Sponsor name is too long." }),
});

export function RunAgentForm(props: {
  onCompleted: (result: RunResult) => void;
  defaultSponsor?: string;
}) {
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: { sponsorName: props.defaultSponsor ?? "" },
  });

  const runMutation = api.agent.run.useMutation({
    onSuccess: (data) => props.onCompleted(data),
  });

  async function onSubmit(values: z.infer<typeof FormSchema>) {
    await runMutation.mutateAsync({ sponsorName: values.sponsorName.trim() });
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex w-full flex-col gap-3 md:flex-row md:items-end"
      >
        <FormField
          control={form.control}
          name="sponsorName"
          render={({ field }) => (
            <FormItem className="w-full md:max-w-sm">
              <FormLabel>Sponsor / GP name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., EQT" {...field} />
              </FormControl>
              <FormDescription>
                Type the private equity firm to screen.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={runMutation.isPending}>
          {runMutation.isPending ? "Running…" : "Run Exit Radar"}
        </Button>
      </form>
    </Form>
  );
}
