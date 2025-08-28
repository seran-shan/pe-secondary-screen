import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/server/auth";
import { SignInForm } from "./sign-in-form";

export default async function SignInPage() {
  // Redirect if already signed in
  const session = await auth();
  if (session?.user) {
    redirect("/");
  }

  return (
    <div className="relative container grid min-h-screen flex-col items-center justify-center lg:max-w-none lg:grid-cols-1 lg:px-0">
      <Suspense fallback={<div>Loading...</div>}>
        <SignInForm />
      </Suspense>
    </div>
  );
}
