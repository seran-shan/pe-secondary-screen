import { redirect } from "next/navigation";
import { auth } from "@/server/auth";

export default async function Home() {
  const session = await auth();

  // Redirect authenticated users to Run scan
  if (session?.user) {
    redirect('/run');
  }

  // Redirect unauthenticated users to sign-in
  redirect('/auth/sign-in');
}
