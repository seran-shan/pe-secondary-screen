"use client";

import * as React from "react";
import { api } from "@/trpc/react";
import type { RouterOutputs } from "@/trpc/react";

// Use actual tRPC types, not generated bloat
type Sponsor = RouterOutputs["sponsor"]["getAll"]["sponsors"][0];

interface SponsorsContextType {
  sponsors: Sponsor[];
  isLoading: boolean;
}

const SponsorsContext = React.createContext<SponsorsContextType | null>(null);

interface SponsorsProviderProps {
  children: React.ReactNode;
}

export function SponsorsProvider({ children }: SponsorsProviderProps) {
  // Real data from tRPC - single source of truth
  const { data: sponsorsData, isLoading } = api.sponsor.getAll.useQuery(
    {
      search: "",
      limit: 100,
      offset: 0,
    },
    {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
  );

  const contextValue: SponsorsContextType = React.useMemo(
    () => ({ sponsors: sponsorsData?.sponsors ?? [], isLoading }),
    [sponsorsData?.sponsors, isLoading],
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

// Export the actual type components need
export type { Sponsor };
