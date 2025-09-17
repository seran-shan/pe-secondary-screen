import { PrismaAdapter } from "@auth/prisma-adapter";
import { type DefaultSession, type NextAuthConfig } from "next-auth";
import Keycloak from "next-auth/providers/keycloak";

import { db } from "@/server/db";
import { env } from "@/env";

/**
 * Module augmentation for `next-auth` types. Allows us to add custom properties to the `session`
 * object and keep type safety.
 *
 * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
 */
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      // ...other properties
      // role: UserRole;
    } & DefaultSession["user"];
    id_token?: string;
    login_hint?: string;
  }

  // interface User {
  //   // ...other properties
  //   // role: UserRole;
  // }
}

/**
 * Options for NextAuth.js used to configure adapters, providers, callbacks, etc.
 *
 * @see https://next-auth.js.org/configuration/options
 */
export const authConfig = {
  providers: [
    Keycloak({
      clientId: env.AUTH_KEYCLOAK_ID,
      clientSecret: env.AUTH_KEYCLOAK_SECRET,
      issuer: env.AUTH_KEYCLOAK_ISSUER,
      allowDangerousEmailAccountLinking: true,
    }),
    /**
     * ...add more providers here.
     *
     * @see https://next-auth.js.org/providers
     */
  ],
  adapter: PrismaAdapter(db),
  pages: {
    signIn: "/auth/sign-in",
    error: "/auth/error",
  },
  session: {
    strategy: "jwt", // Need JWT strategy to access id_token for seamless logout
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    session: ({ session, token }) => ({
      ...session,
      user: {
        ...session.user,
        id: token.sub,
      },
      id_token: token.id_token,
      login_hint: token.login_hint,
    }),
    jwt: ({ token, account, user, profile }) => {
      // Persist the OAuth tokens and profile info
      if (account) {
        token.id_token = account.id_token;
      }
      if (user) {
        token.sub = user.id;
      }
      // Extract login_hint from profile for Microsoft logout
      if (profile?.login_hint) {
        token.login_hint = profile.login_hint;
      }
      return token;
    },
    async signIn({ user: _user, account: _account, profile: _profile }) {
      return true;
    },
  },
} satisfies NextAuthConfig;
