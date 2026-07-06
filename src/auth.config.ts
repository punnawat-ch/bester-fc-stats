import type { NextAuthConfig } from "next-auth";
import type { Role } from "@prisma/client";

/**
 * Edge-safe Auth.js config shared between the middleware (edge runtime) and the
 * full Node config in `src/auth.ts`. It must NOT import Prisma or argon2, since
 * those cannot run in the edge middleware bundle. The Credentials provider (with
 * `authorize`) is added only in `src/auth.ts`.
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
