"use server";

import { signOut, auth } from "@/server/auth";
import { env } from "@/env";
import { redirect } from "next/navigation";

export async function logoutAction() {
  const session = await auth();

  await signOut({ redirect: false });

  const loginHint = session?.login_hint;

  if (loginHint) {
    const msLogoutUrl = new URL(
      "https://login.microsoftonline.com/common/oauth2/v2.0/logout",
    );
    msLogoutUrl.searchParams.set("logout_hint", loginHint);
    msLogoutUrl.searchParams.set(
      "post_logout_redirect_uri",
      `${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/api/auth/keycloak-logout`,
    );

    redirect(msLogoutUrl.toString());
  } else {
    const logoutUrl = new URL(
      `${env.AUTH_KEYCLOAK_ISSUER}/protocol/openid-connect/logout`,
    );

    if (session?.id_token) {
      logoutUrl.searchParams.set("id_token_hint", session.id_token);
    } else {
      logoutUrl.searchParams.set("client_id", env.AUTH_KEYCLOAK_ID);
    }

    logoutUrl.searchParams.set(
      "post_logout_redirect_uri",
      `${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/auth/sign-in`,
    );

    redirect(logoutUrl.toString());
  }
}
