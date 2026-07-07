import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

/**
 * Auth.js proxy (Next.js 16 — renamed from `middleware`; runs on the Node.js
 * runtime). Uses only `authConfig` (no Prisma/argon2). The `authorized` callback
 * in the config gates `/admin/*` (except `/admin/login`): unauthenticated
 * requests are redirected to `/admin/login`.
 */
export const { auth: proxy } = NextAuth(authConfig);

export const config = {
  // Scope to /admin only so the public site and static assets are untouched.
  matcher: ["/admin/:path*"],
};

export default proxy;
