import type { Role } from "@prisma/client";

export type Permission =
  | "dashboard:view"
  | "player:write"
  | "match:write"
  | "club:edit"
  | "user:manage";

const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  ADMIN: [
    "dashboard:view",
    "player:write",
    "match:write",
    "club:edit",
    "user:manage",
  ],
  EDITOR: ["dashboard:view", "player:write", "match:write", "club:edit"],
  VIEWER: ["dashboard:view"],
};

/** Error thrown when a role lacks the required permission. Map to 403 / typed action error. */
export class ForbiddenError extends Error {
  readonly permission: Permission;

  constructor(permission: Permission) {
    super(`Forbidden: missing permission "${permission}"`);
    this.name = "ForbiddenError";
    this.permission = permission;
  }
}

export function can(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function assert(role: Role, permission: Permission): void {
  if (!can(role, permission)) {
    throw new ForbiddenError(permission);
  }
}
