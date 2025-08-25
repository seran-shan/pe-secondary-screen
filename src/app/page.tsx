import { redirect } from "next/navigation";
import { auth } from "@/server/auth";

export default async function Home() {
  const session = await auth();

  // Redirect authenticated users to dashboard
  if (session?.user) {
    redirect('/dashboard');
  }

  // Redirect unauthenticated users to sign-in
  redirect('/auth/sign-in');
}
