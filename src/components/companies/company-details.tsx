"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IconFileText } from "@tabler/icons-react";
import type { PortfolioCompany } from "@/lib/schemas";

interface CompanyDetailsProps {
  company: PortfolioCompany;
}

export function CompanyDetails({ company }: CompanyDetailsProps) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Description Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconFileText className="h-5 w-5" />
            Description
          </CardTitle>
        </CardHeader>
        <CardContent>
          {company.description ? (
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {company.description}
            </p>
          ) : (
            <p className="text-muted-foreground text-sm italic">
              No description available for this company.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
