"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  IconFileText,
  IconListDetails,
  IconTrendingUp,
  IconAlertCircle,
} from "@tabler/icons-react";

interface CompanyDetailsProps {
  company: {
    note?: string | null;
    nextSteps?: string | null;
    financials?: string | null;
    Alert: Array<{
      id: string;
      type: string;
      message: string;
      createdAt: Date;
      readAt?: Date | null;
    }>;
  };
}

export function CompanyDetails({ company }: CompanyDetailsProps) {
  const unreadAlerts = company.Alert.filter((alert) => !alert.readAt);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Notes Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconFileText className="h-5 w-5" />
            Notes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {company.note ? (
            <p className="whitespace-pre-wrap text-sm leading-relaxed">
              {company.note}
            </p>
          ) : (
            <p className="text-muted-foreground text-sm italic">
              No notes available for this company.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Next Steps Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconListDetails className="h-5 w-5" />
            Next Steps
          </CardTitle>
        </CardHeader>
        <CardContent>
          {company.nextSteps ? (
            <p className="whitespace-pre-wrap text-sm leading-relaxed">
              {company.nextSteps}
            </p>
          ) : (
            <p className="text-muted-foreground text-sm italic">
              No next steps defined for this company.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Financials Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconTrendingUp className="h-5 w-5" />
            Financial Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          {company.financials ? (
            <p className="whitespace-pre-wrap text-sm leading-relaxed">
              {company.financials}
            </p>
          ) : (
            <p className="text-muted-foreground text-sm italic">
              No financial information available.
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
                      <span className="text-xs text-muted-foreground">
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
