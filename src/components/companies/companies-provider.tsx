"use client";

import { api } from "@/trpc/react";
import type { RouterOutputs } from "@/trpc/react";
import {
  createContext,
  useContext,
  type ReactNode,
  useState,
  useEffect,
} from "react";
import { useSession } from "next-auth/react";
import { pusherClient } from "@/lib/pusher.client";
import { toast } from "sonner";

interface CompaniesContextType {
  enrichingIds: Set<string>;
  enrichCompanies: (companyIds: string[]) => void;
}

const CompaniesContext = createContext<CompaniesContextType | undefined>(
  undefined,
);

export const useCompanies = () => {
  const context = useContext(CompaniesContext);
  if (!context) {
    throw new Error("useCompanies must be used within a CompaniesProvider");
  }
  return context;
};

export const CompaniesProvider = ({
  children,
  sponsorId,
}: {
  children: ReactNode;
  sponsorId?: string;
}) => {
  const [enrichingIds, setEnrichingIds] = useState<Set<string>>(new Set());
  const { data: session } = useSession();
  const utils = api.useUtils();

  const enrichMutation = api.company.enrich.useMutation({
    onSuccess: (data) => {
      setEnrichingIds((prev) => new Set([...prev, ...data.companyIds]));
      toast.info(`Enrichment started for ${data.companyIds.length} companies.`);
    },
    onError: (error) => {
      toast.error(`Failed to start enrichment: ${error.message}`);
    },
  });

  useEffect(() => {
    if (!session?.user?.id) return;

    const channel = pusherClient.subscribe(`user-${session.user.id}`);

    const onComplete = ({ companyId }: { companyId: string }) => {
      setEnrichingIds((prev) => {
        const next = new Set(prev);
        next.delete(companyId);
        return next;
      });
      void utils.company.getAll.invalidate();
      if (sponsorId) {
        void utils.sponsor.getByIdWithPortfolio.invalidate({ id: sponsorId });
      }
    };

    const onError = ({
      companyId,
      error,
    }: {
      companyId: string;
      error: string;
    }) => {
      setEnrichingIds((prev) => {
        const next = new Set(prev);
        next.delete(companyId);
        return next;
      });
      toast.error(`Enrichment failed for company: ${error}`);
    };

    channel.bind("enrichment-complete", onComplete);
    channel.bind("enrichment-error", onError);

    return () => {
      channel.unbind("enrichment-complete", onComplete);
      channel.unbind("enrichment-error", onError);
      pusherClient.unsubscribe(`user-${session.user.id}`);
    };
  }, [session?.user?.id, utils, sponsorId]);

  const enrichCompanies = (companyIds: string[]) => {
    enrichMutation.mutate({ companyIds });
  };

  return (
    <CompaniesContext.Provider
      value={{
        enrichingIds,
        enrichCompanies,
      }}
    >
      {children}
    </CompaniesContext.Provider>
  );
};
