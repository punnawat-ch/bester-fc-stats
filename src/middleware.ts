import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

/**
 * Edge-safe Auth.js middleware. Uses only `authConfig` (no Prisma/argon2), so
 * it can run in the middleware runtime. The `authorized` callback in the config
 * gates `/admin/*` (except `/admin/login`): unauthenticated requests are
 * redirected to `/admin/login`.
 */
export const { auth: middleware } = NextAuth(authConfig);

export const config = {
  // Scope to /admin only so the public site and static assets are untouched.
  matcher: ["/admin/:path*"],
};

export default middleware;
