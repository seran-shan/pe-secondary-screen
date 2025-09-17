import { NextRequest } from "next/server";
import { redirect } from "next/navigation";
import { env } from "@/env";

// Step 2 of two-step logout: After Microsoft logout, clean up Keycloak session
export async function GET(request: NextRequest) {
  // Generate Keycloak logout URL
  const logoutUrl = new URL(
    `${env.AUTH_KEYCLOAK_ISSUER}/protocol/openid-connect/logout`,
  );

  // Use client_id since Microsoft logout already happened
  logoutUrl.searchParams.set("client_id", env.AUTH_KEYCLOAK_ID);
  logoutUrl.searchParams.set(
    "post_logout_redirect_uri",
    `${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/auth/sign-in`,
  );

  // Final redirect to clean up Keycloak session
  redirect(logoutUrl.toString());
}
