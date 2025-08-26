import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { AlertCircle } from "lucide-react";

interface AuthErrorPageProps {
  searchParams: Promise<{ error?: string }>;
}

export default async function AuthErrorPage({
  searchParams,
}: AuthErrorPageProps) {
  const params = await searchParams;
  const error = params.error;

  const getErrorMessage = (error?: string) => {
    switch (error) {
      case "Configuration":
        return "There is a problem with the server configuration.";
      case "AccessDenied":
        return "Access denied. You do not have permission to sign in.";
      case "Verification":
        return "The verification token has expired or has already been used.";
      case "Default":
      default:
        return "An unexpected error occurred during authentication.";
    }
  };

  return (
    <div className="relative container grid min-h-screen flex-col items-center justify-center lg:max-w-none lg:grid-cols-1 lg:px-0">
      <div className="lg:p-8">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <Card className="mx-auto w-full max-w-md">
            <CardHeader className="space-y-1">
              <div className="mb-4 flex items-center justify-center">
                <AlertCircle className="text-destructive h-12 w-12" />
              </div>
              <CardTitle className="text-center text-2xl">
                Authentication Error
              </CardTitle>
              <CardDescription className="text-center">
                {getErrorMessage(error)}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <div className="bg-destructive/10 border-destructive/20 rounded-md border p-3">
                  <p className="text-destructive text-sm">
                    Error code: {error}
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Link href="/auth/sign-in">
                  <Button className="w-full">Try signing in again</Button>
                </Link>

                <Link href="/">
                  <Button variant="outline" className="w-full">
                    Return to home
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
