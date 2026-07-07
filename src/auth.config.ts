import type { NextAuthConfig } from "next-auth";
import type { Role } from "@prisma/client";

/**
 * Auth.js config shared between the proxy (`src/proxy.ts`, Next.js 16 — Node.js
 * runtime) and the full config in `src/auth.ts`. Kept provider-free (no
 * Credentials/Prisma/argon2) so the proxy bundle stays lean; the Credentials
 * provider with `authorize` is added only in `src/auth.ts`.
 */
export const authConfig = {
  session: { strategy: "jwt" },
  pages: { signIn: "/admin/login" },
  providers: [],
  callbacks: {
    jwt: ({ token, user }) => {
      if (user) {
        token.id = user.id ?? "";
        token.role = user.role;
      }
      return token;
    },
    session: ({ session, token }) => {
      const claims = token as { id?: string; role?: Role };
      if (claims.id) {
        session.user.id = claims.id;
      }
      if (claims.role) {
        session.user.role = claims.role;
      }
      return session;
    },
    authorized: ({ auth, request }) => {
      const { pathname } = request.nextUrl;
      // The login page lives under /admin/login and must stay public,
      // otherwise unauthenticated users get redirected into a loop.
      if (pathname.startsWith("/admin/login")) {
        return true;
      }
      if (pathname.startsWith("/admin")) {
        return Boolean(auth);
      }
      return true;
    },
  },
} satisfies NextAuthConfig;
