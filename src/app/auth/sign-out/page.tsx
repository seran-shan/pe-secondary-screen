import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { signOut } from "@/server/auth";
import { auth } from "@/server/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function SignOutPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/sign-in");
  }

  return (
    <div className="relative container grid min-h-screen flex-col items-center justify-center lg:max-w-none lg:grid-cols-1 lg:px-0">
      <div className="lg:p-8">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <Card className="mx-auto w-full max-w-md">
            <CardHeader className="space-y-1">
              <CardTitle className="text-center text-2xl">Sign out</CardTitle>
              <CardDescription className="text-center">
                Are you sure you want to sign out of your account?
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-center">
                <p className="text-muted-foreground text-sm">
                  Signed in as:{" "}
                  <span className="font-medium">{session.user.email}</span>
                </p>
              </div>

              <form
                action={async () => {
                  "use server";
                  await signOut({ redirectTo: "/" });
                }}
                className="space-y-4"
              >
                <Button type="submit" className="w-full">
                  Yes, sign me out
                </Button>
              </form>

              <Link href="/dashboard">
                <Button variant="outline" className="w-full">
                  Cancel
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
