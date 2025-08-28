"use client";

import { usePathname } from "next/navigation";
import { useMemo } from "react";
import { api } from "@/trpc/react";

type BreadcrumbItem = {
  title: string;
  link: string;
};

// This allows to add custom title as well
const routeMapping: Record<string, BreadcrumbItem[]> = {
  // Add more custom mappings as needed
};

export function useBreadcrumbs() {
  const pathname = usePathname();

  // Check if we're on a sponsor detail page
  const sponsorMatch = /^\/sponsors\/([^\/]+)$/.exec(pathname);
  const sponsorId = sponsorMatch?.[1];

  // Fetch sponsor data if we're on a sponsor page
  const { data: sponsor } = api.sponsor.getById.useQuery(
    { id: sponsorId! },
    { enabled: !!sponsorId },
  );

  const breadcrumbs = useMemo(() => {
    // Check if we have a custom mapping for this exact path
    if (routeMapping[pathname]) {
      return routeMapping[pathname];
    }

    // If no exact match, fall back to generating breadcrumbs from the path
    const segments = pathname.split("/").filter(Boolean);
    return segments.map((segment, index) => {
      const path = `/${segments.slice(0, index + 1).join("/")}`;

      // Special handling for sponsor pages
      if (segment === "sponsors") {
        return {
          title: "Sponsors",
          link: path,
        };
      } else if (sponsorId && segment === sponsorId && sponsor) {
        return {
          title: sponsor.name,
          link: path,
        };
      } else {
        return {
          title: segment.charAt(0).toUpperCase() + segment.slice(1),
          link: path,
        };
      }
    });
  }, [pathname, sponsor, sponsorId]);

  return breadcrumbs;
}
