"use client";

// Define proper types for kbar data
interface CompanySearchData {
  id: number;
  company: string;
  sponsor: string;
  invested?: string;
  sector?: string;
  source?: string;
  status: "Active" | "Exited";
  location?: string;
  financials?: string;
  nextSteps?: string;
  note?: string;
  comments?: Array<{
    id: string;
    content: string;
    author: { id: string; name: string | null; image: string | null };
    createdAt: string;
  }>;
  watchersCount: number;
  isWatched: boolean;
}

import { navItems } from "@/constants/data";
import { api } from "@/trpc/react";
import {
  KBarAnimator,
  KBarPortal,
  KBarPositioner,
  KBarProvider,
  KBarSearch,
  useRegisterActions,
} from "kbar";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import RenderResults from "./render-result";
import useThemeSwitching from "./use-theme-switching";
import { useCompanyDrawer } from "@/components/companies/company-drawer-context";
import type { CompanyDetail } from "@/components/companies/company-drawer";

export default function KBar({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const sponsors = api.sponsor.listNames.useQuery(undefined, {
    staleTime: 60_000,
  });
  const companies = api.company.getAll.useQuery(undefined, {
    staleTime: 60_000,
  });

  // These action are for the navigation
  const baseNavActions = useMemo(() => {
    // Define navigateTo inside the useMemo callback to avoid dependency array issues
    const navigateTo = (url: string) => {
      router.push(url);
    };

    const baseNav = navItems.flatMap((navItem) => {
      // Only include base action if the navItem has a real URL and is not just a container
      const baseAction =
        navItem.url !== "#"
          ? {
              id: `${navItem.title.toLowerCase()}Action`,
              name: navItem.title,
              shortcut: navItem.shortcut,
              keywords: navItem.title.toLowerCase(),
              section: "Navigation",
              subtitle: `Go to ${navItem.title}`,
              perform: () => navigateTo(navItem.url),
            }
          : null;

      // Map child items into actions
      const childActions =
        navItem.items?.map((childItem) => ({
          id: `${childItem.title.toLowerCase()}Action`,
          name: childItem.title,
          shortcut: childItem.shortcut,
          keywords: childItem.title.toLowerCase(),
          section: navItem.title,
          subtitle: `Go to ${childItem.title}`,
          perform: () => navigateTo(childItem.url),
        })) ?? [];

      // Return only valid actions (ignoring null base actions for containers)
      return baseAction ? [baseAction, ...childActions] : childActions;
    });

    return baseNav;
  }, [router]);

  const sponsorActions = useMemo(() => {
    return (sponsors.data ?? []).map((s) => ({
      id: `sponsor-${s.name.toLowerCase()}`,
      name: s.name,
      keywords: `sponsor ${s.name}`.toLowerCase(),
      section: "Sponsors",
      subtitle: "Open sponsor profile",
      perform: () => router.push(`/sponsors/${s.id}`),
    }));
  }, [router, sponsors.data]);

  return (
    <KBarProvider actions={baseNavActions}>
      <KBarComponent
        dynamicActions={sponsorActions}
        companies={companies.data ?? []}
      >
        {children}
      </KBarComponent>
    </KBarProvider>
  );
}
const KBarComponent = ({
  children,
  dynamicActions,
  companies,
}: {
  children: React.ReactNode;
  dynamicActions: unknown[];
  companies: CompanySearchData[];
}) => {
  useThemeSwitching();
  const { openCompanyDrawer } = useCompanyDrawer();

  const companyActions = useMemo(() => {
    return companies.map((company) => ({
      id: `company-${company.company.toLowerCase().replace(/\s+/g, "-")}`,
      name: company.company,
      keywords: `company ${company.company} ${company.sponsor}`.toLowerCase(),
      section: "Companies",
      subtitle: `${company.sponsor} • ${company.sector ?? "No sector"}`,
      perform: () => {
        const companyDetail: CompanyDetail = {
          id: company.id.toString(),
          company: company.company,
          sponsor: company.sponsor,
          dateInvested: company.invested,
          sector: company.sector,
          webpage: company.source,
          note: company.note,
          location: company.location,
          financials: company.financials,
          nextSteps: company.nextSteps,
          status: company.status,
          signals: [], // Mock data
          comments: company.comments ?? [],
          watchersCount: company.watchersCount,
          isWatched: company.isWatched,
        };
        openCompanyDrawer(companyDetail);
      },
    }));
  }, [companies, openCompanyDrawer]);

  const allDynamicActions = useMemo(() => {
    return [...dynamicActions, ...companyActions];
  }, [dynamicActions, companyActions]);

  useRegisterActions(allDynamicActions, [allDynamicActions]);

  return (
    <>
      <KBarPortal>
        <KBarPositioner className="bg-background/80 fixed inset-0 z-99999 p-0! backdrop-blur-sm">
          <KBarAnimator className="bg-card text-card-foreground relative mt-64! w-full max-w-[600px] -translate-y-12! overflow-hidden rounded-lg border shadow-lg">
            <div className="bg-card border-border sticky top-0 z-10 border-b">
              <KBarSearch className="bg-card w-full border-none px-6 py-4 text-lg outline-hidden focus:ring-0 focus:ring-offset-0 focus:outline-hidden" />
            </div>
            <div className="max-h-[400px]">
              <RenderResults />
            </div>
          </KBarAnimator>
        </KBarPositioner>
      </KBarPortal>
      {children}
    </>
  );
};
