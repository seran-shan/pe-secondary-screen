"use client";

import * as React from "react";
import { CompanyDrawer } from "./company-drawer";
import type { RouterOutputs } from "@/trpc/react";

type Company = RouterOutputs["company"]["getAll"][0];

interface CompanyDrawerContextValue {
  openCompanyDrawer: (company: Company) => void;
  closeCompanyDrawer: () => void;
  isOpen: boolean;
}

const CompanyDrawerContext = React.createContext<
  CompanyDrawerContextValue | undefined
>(undefined);

export function CompanyDrawerProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [selectedCompany, setSelectedCompany] =
    React.useState<Company | null>(null);

  const openCompanyDrawer = React.useCallback((company: Company) => {
    setSelectedCompany(company);
    setDrawerOpen(true);
  }, []);

  const closeCompanyDrawer = React.useCallback(() => {
    setDrawerOpen(false);
    setSelectedCompany(null);
  }, []);

  const contextValue = React.useMemo(
    () => ({
      openCompanyDrawer,
      closeCompanyDrawer,
      isOpen: drawerOpen,
    }),
    [openCompanyDrawer, closeCompanyDrawer, drawerOpen],
  );

  return (
    <CompanyDrawerContext.Provider value={contextValue}>
      {children}
      <CompanyDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        data={selectedCompany}
      />
    </CompanyDrawerContext.Provider>
  );
}

export function useCompanyDrawer() {
  const context = React.useContext(CompanyDrawerContext);
  if (context === undefined) {
    throw new Error(
      "useCompanyDrawer must be used within a CompanyDrawerProvider",
    );
  }
  return context;
}
