"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

export type Sponsor = {
  id: string;
  name: string;
  contact?: string | null;
  portfolio?: Array<{
    asset?: string;
    webpage?: string;
    fsnSector?: string;
    dateInvested?: string;
  }>;
  _optimistic?: boolean; // Flag for optimistic updates
};

type OptimisticSponsor = Sponsor & {
  _optimistic: true;
  _tempId: string; // Temporary ID for optimistic updates
};

interface SponsorsContextType {
  sponsors: Sponsor[];
  addOptimisticSponsor: (sponsor: Omit<Sponsor, "id">) => string;
  removeOptimisticSponsor: (tempId: string) => void;
  updateOptimisticSponsor: (tempId: string, updates: Partial<Sponsor>) => void;
  refreshSponsors: () => void;
}

const SponsorsContext = React.createContext<SponsorsContextType | null>(null);

interface SponsorsProviderProps {
  children: React.ReactNode;
  initialSponsors: Sponsor[];
}

export function SponsorsProvider({
  children,
  initialSponsors,
}: SponsorsProviderProps) {
  const router = useRouter();
  const [sponsors, setSponsors] = React.useState<Sponsor[]>(initialSponsors);

  // Update sponsors when initial data changes (from server refetch)
  React.useEffect(() => {
    setSponsors((current) => {
      // Keep optimistic sponsors but update real ones
      const optimisticSponsors = current.filter((s) => s._optimistic);
      const realSponsors = initialSponsors.filter((s) => !s._optimistic);
      return [...optimisticSponsors, ...realSponsors];
    });
  }, [initialSponsors]);

  const addOptimisticSponsor = React.useCallback(
    (sponsorData: Omit<Sponsor, "id">) => {
      const tempId = `optimistic-${Date.now()}-${Math.random()}`;
      const optimisticSponsor: OptimisticSponsor = {
        ...sponsorData,
        id: tempId,
        _optimistic: true,
        _tempId: tempId,
        portfolio: [], // Start with empty portfolio
      };

      setSponsors((current) => [optimisticSponsor, ...current]);
      return tempId;
    },
    [],
  );

  const removeOptimisticSponsor = React.useCallback((tempId: string) => {
    setSponsors((current) =>
      current.filter(
        (sponsor) =>
          !(
            sponsor._optimistic &&
            (sponsor as OptimisticSponsor)._tempId === tempId
          ),
      ),
    );
  }, []);

  const updateOptimisticSponsor = React.useCallback(
    (tempId: string, updates: Partial<Sponsor>) => {
      setSponsors((current) =>
        current.map((sponsor) =>
          sponsor._optimistic &&
          (sponsor as OptimisticSponsor)._tempId === tempId
            ? { ...sponsor, ...updates }
            : sponsor,
        ),
      );
    },
    [],
  );

  const refreshSponsors = React.useCallback(() => {
    router.refresh();
  }, [router]);

  const contextValue = React.useMemo(
    () => ({
      sponsors,
      addOptimisticSponsor,
      removeOptimisticSponsor,
      updateOptimisticSponsor,
      refreshSponsors,
    }),
    [
      sponsors,
      addOptimisticSponsor,
      removeOptimisticSponsor,
      updateOptimisticSponsor,
      refreshSponsors,
    ],
  );

  return (
    <SponsorsContext.Provider value={contextValue}>
      {children}
    </SponsorsContext.Provider>
  );
}

export function useSponsors() {
  const context = React.useContext(SponsorsContext);
  if (!context) {
    throw new Error("useSponsors must be used within a SponsorsProvider");
  }
  return context;
}
