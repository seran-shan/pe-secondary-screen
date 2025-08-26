import { auth } from "@/server/auth";
import { redirect } from "next/navigation";

export default async function Dashboard() {
  const session = await auth();

  if (!session?.user) {
    return redirect("/auth/sign-in");
  } else {
    redirect("/dashboard/analytics");
  }
}
