import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { IconArrowLeft, IconSearch } from "@tabler/icons-react";
import PageContainer from "@/components/layout/page-container";

export default function SponsorNotFound() {
  return (
    <PageContainer>
      <div className="flex min-h-[60vh] items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="bg-muted mx-auto mb-4 flex size-12 items-center justify-center rounded-full">
              <IconSearch className="text-muted-foreground size-6" />
            </div>
            <CardTitle>Sponsor Not Found</CardTitle>
            <CardDescription>
              The sponsor you&apos;re looking for doesn&apos;t exist or may have
              been removed.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Button asChild>
              <Link href="/workspace/sponsors" className="flex items-center gap-2">
                <IconArrowLeft className="size-4" />
                Back to Sponsors
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/workspace/companies" className="flex items-center gap-2">
                View Companies
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
