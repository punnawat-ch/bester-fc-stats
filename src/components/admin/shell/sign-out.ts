import { signOut } from "next-auth/react";

/** Sign the current admin out and return to the public login screen. */
export function signOutToLogin(): Promise<void> {
  return signOut({ callbackUrl: "/admin/login" });
}
