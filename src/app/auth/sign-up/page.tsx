import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/server/auth";
import { type Metadata } from "next";
import { SignUpForm } from "./sign-up-form";

export const metadata: Metadata = {
  title: "Sign Up - Authentication",
  description: "Create a new account with GitHub.",
};

// Get GitHub stars for the UI
async function getGitHubStars(): Promise<number> {
  try {
    const response = await fetch(
      "https://api.github.com/repos/seranshanmugathas/pe-secondary-screen",
    );
    if (!response.ok) return 0;
    const data = (await response.json()) as { stargazers_count?: number };
    return data.stargazers_count ?? 0;
  } catch {
    return 0;
  }
}

export default async function SignUpPage() {
  // Redirect if already signed in
  const session = await auth();
  if (session?.user) {
    redirect("/");
  }

  const stars = await getGitHubStars();

  return (
    <div className="relative container grid min-h-screen flex-col items-center justify-center lg:max-w-none lg:grid-cols-1 lg:px-0">
      <Suspense fallback={<div>Loading...</div>}>
        <SignUpForm stars={stars} />
      </Suspense>
    </div>
  );
}
