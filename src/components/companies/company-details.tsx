"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { IconFileText, IconAlertCircle } from "@tabler/icons-react";
import type { PortfolioCompany, Alert } from "@/lib/schemas";

interface CompanyDetailsProps {
  company: PortfolioCompany & {
    Alert: Array<Alert>;
  };
}

export function CompanyDetails({ company }: CompanyDetailsProps) {
  const unreadAlerts = company.Alert.filter((alert) => !alert.readAt);

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

      {/* Alerts Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconAlertCircle className="h-5 w-5" />
            Recent Alerts
            {unreadAlerts.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unreadAlerts.length}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {company.Alert.length > 0 ? (
            <div className="space-y-3">
              {company.Alert.slice(0, 5).map((alert) => (
                <div
                  key={alert.id}
                  className={`rounded-lg border p-3 text-sm ${
                    !alert.readAt ? "bg-red-50 dark:bg-red-950/20" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="font-medium capitalize">{alert.type}</p>
                      <p className="text-muted-foreground mt-1">
                        {alert.message}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-muted-foreground text-xs">
                        {alert.createdAt.toLocaleDateString()}
                      </span>
                      {!alert.readAt && (
                        <Badge variant="destructive" className="text-xs">
                          New
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {company.Alert.length > 5 && (
                <p className="text-muted-foreground text-center text-sm">
                  and {company.Alert.length - 5} more alerts...
                </p>
              )}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm italic">
              No alerts for this company.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
