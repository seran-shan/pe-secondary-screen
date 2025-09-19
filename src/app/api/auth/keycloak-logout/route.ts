import { redirect } from "next/navigation";
import { env } from "@/env";
import { auth } from "@/server/auth";

export async function GET() {
  const session = await auth();
  const idToken = session?.id_token;

  const params = new URLSearchParams();
  if (idToken) {
    params.set("id_token_hint", idToken);
  }
  params.set("post_logout_redirect_uri", `${env.NEXTAUTH_URL}/auth/sign-out`);
  const logoutUrl = `${
    env.AUTH_KEYCLOAK_ISSUER
  }/protocol/openid-connect/logout?${params.toString()}`;

  redirect(logoutUrl);
}
