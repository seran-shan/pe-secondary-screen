"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { api } from "@/trpc/react";

export type PortfolioCompany = {
  asset?: string;
  webpage?: string;
  fsnSector?: string;
  dateInvested?: string;
  _optimistic?: boolean; // Flag for optimistic portfolio companies
  _tempId?: string; // Temporary ID for optimistic companies
};

export type Sponsor = {
  id: string;
  name: string;
  contact?: string | null;
  portfolio?: PortfolioCompany[];
  _optimistic?: boolean; // Flag for optimistic updates
  _discoveryInProgress?: boolean; // Flag for discovery in progress
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
  addOptimisticPortfolioCompanies: (
    sponsorId: string,
    companies: PortfolioCompany[],
    mode: "append" | "update" | "replace",
  ) => void;
  updateSponsorDiscoveryStatus: (
    sponsorId: string,
    isDiscovering: boolean,
  ) => void;
  updateSponsorWithRealData: (
    sponsorId: string,
    updatedSponsor: Sponsor,
  ) => void;
  refreshSponsors: () => void;
}

const SponsorsContext = React.createContext<SponsorsContextType | null>(null);

interface SponsorsProviderProps {
  children: React.ReactNode;
  initialSponsors?: Sponsor[];
}

export function SponsorsProvider({
  children,
  initialSponsors = [],
}: SponsorsProviderProps) {
  const router = useRouter();
  const [sponsors, setSponsors] = React.useState<Sponsor[]>(initialSponsors);

  // Fetch sponsors if no initial data provided
  const { data: sponsorsData } = api.sponsor.getAll.useQuery(
    { limit: 100 },
    {
      enabled: initialSponsors.length === 0,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  );

  // Update sponsors when data changes
  React.useEffect(() => {
    if (sponsorsData?.sponsors) {
      const fetchedSponsors: Sponsor[] = sponsorsData.sponsors.map((s) => ({
        id: s.id,
        name: s.name,
        contact: s.contact,
        portfolio: [], // We'll load portfolio separately if needed
      }));

      setSponsors((current) => {
        // Keep optimistic sponsors but update real ones
        const optimisticSponsors = current.filter((s) => s._optimistic);
        const realSponsors = fetchedSponsors.filter((s) => !s._optimistic);
        return [...optimisticSponsors, ...realSponsors];
      });
    }
  }, [sponsorsData]);

  // Update sponsors when initial data changes (from server refetch)
  React.useEffect(() => {
    if (initialSponsors.length > 0) {
      setSponsors((current) => {
        // Keep optimistic sponsors but update real ones
        const optimisticSponsors = current.filter((s) => s._optimistic);
        const realSponsors = initialSponsors.filter((s) => !s._optimistic);
        return [...optimisticSponsors, ...realSponsors];
      });
    }
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

  const addOptimisticPortfolioCompanies = React.useCallback(
    (
      sponsorId: string,
      companies: PortfolioCompany[],
      mode: "append" | "update" | "replace",
    ) => {
      setSponsors((current) =>
        current.map((sponsor) => {
          if (sponsor.id !== sponsorId) return sponsor;

          // Mark companies as optimistic
          const optimisticCompanies = companies.map((company, index) => ({
            ...company,
            _optimistic: true,
            _tempId: `optimistic-company-${Date.now()}-${index}`,
          }));

          const currentPortfolio = sponsor.portfolio ?? [];

          let newPortfolio: PortfolioCompany[];
          switch (mode) {
            case "replace":
              // Remove non-optimistic companies and add new optimistic ones
              newPortfolio = [
                ...currentPortfolio.filter((c) => c._optimistic),
                ...optimisticCompanies,
              ];
              break;
            case "update":
              // For update mode, we append optimistic companies but indicate it's an update
              newPortfolio = [...currentPortfolio, ...optimisticCompanies];
              break;
            case "append":
            default:
              // Add optimistic companies to existing portfolio
              newPortfolio = [...currentPortfolio, ...optimisticCompanies];
              break;
          }

          return {
            ...sponsor,
            portfolio: newPortfolio,
          };
        }),
      );
    },
    [],
  );

  const updateSponsorDiscoveryStatus = React.useCallback(
    (sponsorId: string, isDiscovering: boolean) => {
      setSponsors((current) =>
        current.map((sponsor) =>
          sponsor.id === sponsorId
            ? { ...sponsor, _discoveryInProgress: isDiscovering }
            : sponsor,
        ),
      );
    },
    [],
  );

  const updateSponsorWithRealData = React.useCallback(
    (sponsorId: string, updatedSponsor: Sponsor) => {
      setSponsors((current) =>
        current.map((sponsor) =>
          sponsor.id === sponsorId
            ? {
                ...updatedSponsor,
                _discoveryInProgress: false, // Clear discovery status
              }
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
      addOptimisticPortfolioCompanies,
      updateSponsorDiscoveryStatus,
      updateSponsorWithRealData,
      refreshSponsors,
    }),
    [
      sponsors,
      addOptimisticSponsor,
      removeOptimisticSponsor,
      updateOptimisticSponsor,
      addOptimisticPortfolioCompanies,
      updateSponsorDiscoveryStatus,
      updateSponsorWithRealData,
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
