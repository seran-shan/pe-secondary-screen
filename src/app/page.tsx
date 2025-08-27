import { redirect } from "next/navigation";
import { auth } from "@/server/auth";
import PageContainer from "@/components/layout/page-container";
import { HomepageHero } from "@/components/homepage/homepage-hero";
import { HomepageMetrics } from "@/components/homepage/homepage-metrics";
import { RecentActivity } from "@/components/homepage/recent-activity";
import { ChartAreaInteractive } from "@/components/chart-area-interactive";
import { Separator } from "@/components/ui/separator";
import KBar from "@/components/kbar";
import AppSidebar from "@/components/layout/app-sidebar";
import Header from "@/components/layout/header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { cookies } from "next/headers";

export const metadata = {
  title: "FSN Exit Radar",
  description: "AI-powered secondary screening for portfolio companies",
};

export default async function Home() {
  const session = await auth();

  // Redirect unauthenticated users to sign-in
  if (!session?.user) {
    redirect("/auth/sign-in");
  }

  // Show the homepage for authenticated users
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get("sidebar_state")?.value === "true";

  return (
    <KBar>
      <SidebarProvider defaultOpen={defaultOpen}>
        <AppSidebar />
        <SidebarInset>
          <Header />
          <PageContainer scrollable={true}>
            <div className="flex flex-1 flex-col space-y-8">
              {/* Hero Section with Quick Actions */}
              <HomepageHero />

              <Separator />

              {/* Key Metrics */}
              <div className="space-y-4">
                <div className="px-4 lg:px-6">
                  <h2 className="text-2xl font-bold tracking-tight">
                    Platform Overview
                  </h2>
                  <p className="text-muted-foreground">
                    Real-time insights into your screening activities and
                    discoveries
                  </p>
                </div>
                <HomepageMetrics />
              </div>

              <Separator />

              {/* Portfolio Discovery Chart */}
              <div className="space-y-4 px-4 lg:px-6">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight">
                    Discovery Timeline
                  </h2>
                  <p className="text-muted-foreground">
                    Portfolio companies and sponsors added over time
                  </p>
                </div>
                <ChartAreaInteractive />
              </div>

              <Separator />

              {/* Recent Activity */}
              <div className="space-y-6 px-4 lg:px-6">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight">
                    Recent Activity
                  </h2>
                  <p className="text-muted-foreground">
                    Stay updated with your latest scans, watchlist, and alerts
                  </p>
                </div>
                <RecentActivity />
              </div>
            </div>
          </PageContainer>
        </SidebarInset>
      </SidebarProvider>
    </KBar>
  );
}
