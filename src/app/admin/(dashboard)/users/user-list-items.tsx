import type { Role } from "@prisma/client";

import { Badge } from "@/components/ui/badge";
import { StatusChip } from "@/components/admin/StatusChip";
import { UserActions } from "./user-actions";
import type { UserListItem } from "./types";

/**
 * Presentational renderers for the Users list. `UserCard` is the mobile card
 * (`<md`) and `UserRowCells` returns the `<td>` cells for the `md+` table — both
 * fed to `ResponsiveList`. Actions live in the client `UserActions` component.
 */

type RoleBadgeVariant = "info" | "neutral";

function roleVariant(role: Role): RoleBadgeVariant {
  return role === "ADMIN" ? "info" : "neutral";
}

function RoleBadge({ role }: Readonly<{ role: Role }>) {
  return (
    <Badge
      variant={roleVariant(role)}
      data-tour="user-role"
      aria-label={`Role: ${role}`}
    >
      {role}
    </Badge>
  );
}

type UserItemProps = Readonly<{
  user: UserListItem;
  currentUserId: string;
}>;

export function UserCard({ user, currentUserId }: UserItemProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 shadow-[0_12px_30px_rgba(0,0,0,0.35)] ring-1 ring-white/10">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-0.5">
          <p className="truncate font-semibold text-white">
            {user.name ?? "Unnamed user"}
          </p>
          <p className="truncate text-sm text-white/60">{user.email}</p>
        </div>
        <UserActions user={user} currentUserId={currentUserId} />
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <RoleBadge role={user.role} />
        <StatusChip status={user.isActive ? "ACTIVE" : "INACTIVE"} />
        <span className="text-xs text-white/50">
          Last login: {user.lastLoginLabel}
        </span>
      </div>
    </div>
  );
}

export function UserRowCells({ user, currentUserId }: UserItemProps) {
  return (
    <>
      <td className="font-medium text-white">
        {user.name ?? "Unnamed user"}
      </td>
      <td className="text-white/70">{user.email}</td>
      <td>
        <RoleBadge role={user.role} />
      </td>
      <td>
        <StatusChip status={user.isActive ? "ACTIVE" : "INACTIVE"} />
      </td>
      <td className="text-white/60">{user.lastLoginLabel}</td>
      <td className="text-right">
        <div className="flex justify-end">
          <UserActions user={user} currentUserId={currentUserId} />
        </div>
      </td>
    </>
  );
}
