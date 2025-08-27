"use client";

import React from "react";
// import { useTheme } from 'next-themes';
import { TRPCReactProvider } from "@/trpc/react";
import { ActiveThemeProvider } from "@/components/active-theme";
import { SessionProvider } from "next-auth/react";
import { CompanyDrawerProvider } from "@/components/companies/company-drawer-context";

export default function Providers({
  activeThemeValue,
  children,
}: {
  activeThemeValue: string;
  children: React.ReactNode;
}) {
  // Theme management for the application
  // const { resolvedTheme } = useTheme();

  return (
    <TRPCReactProvider>
      <ActiveThemeProvider initialTheme={activeThemeValue}>
        <SessionProvider>
          <CompanyDrawerProvider>{children}</CompanyDrawerProvider>
        </SessionProvider>
      </ActiveThemeProvider>
    </TRPCReactProvider>
  );
}
