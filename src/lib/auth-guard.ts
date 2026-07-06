import "server-only";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { assert, type Permission } from "@/lib/rbac";
import type { Session } from "next-auth";

/**
 * Server-side guard for admin pages and server actions.
 * - Redirects to `/admin/login` when there is no session.
 * - Optionally asserts a permission (throws `ForbiddenError` when missing).
 *
 * Returns the authenticated session so callers can read `session.user`.
 */
export async function requireUser(permission?: Permission): Promise<Session> {
  const session = await auth();
  if (!session?.user) {
    redirect("/admin/login");
  }

  if (permission) {
    assert(session.user.role, permission);
  }

  return session;
}
