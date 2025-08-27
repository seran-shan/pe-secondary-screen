import { redirect } from "next/navigation";

export default function WorkspacePage() {
  // Redirect to sponsors as the main workspace page
  redirect("/sponsors");
}
