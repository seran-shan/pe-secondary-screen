import { PrismaAdapter } from "@auth/prisma-adapter";
import { type DefaultSession, type NextAuthConfig } from "next-auth";
import MicrosoftEntraIdProvider from "next-auth/providers/microsoft-entra-id";

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
    MicrosoftEntraIdProvider({
      clientId: env.AUTH_MICROSOFT_ENTRA_ID,
      clientSecret: env.AUTH_MICROSOFT_ENTRA_SECRET,
      issuer: `https://login.microsoftonline.com/${env.AUTH_MICROSOFT_ENTRA_TENANT_ID}/v2.0`,
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
    signOut: "/auth/sign-out",
    error: "/auth/error",
  },
  callbacks: {
    session: ({ session, user: _user }) => ({
      ...session,
      user: {
        ...session.user,
        id: _user.id,
      },
    }),
    async signIn({ user: _user, account: _account, profile: _profile }) {
      return true;
    },
  },
} satisfies NextAuthConfig;
