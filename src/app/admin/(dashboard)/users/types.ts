import type { Role } from "@prisma/client";

/**
 * Serializable view model passed from the server `page.tsx` down to the client
 * list/action components. `lastLoginLabel` is pre-formatted on the server so the
 * client never has to deal with raw Date objects.
 */
export type UserListItem = Readonly<{
  id: string;
  email: string;
  name: string | null;
  role: Role;
  isActive: boolean;
  lastLoginLabel: string;
}>;
