import type { Role } from "@prisma/client";
import {
  CalendarDays,
  LayoutDashboard,
  LifeBuoy,
  Settings,
  UserCog,
  Users,
  type LucideIcon,
} from "lucide-react";

import { can, type Permission } from "@/lib/rbac";

/**
 * Admin navigation config (admin-ux-spec §2.2 / §2.3). A single source of truth
 * for the sidebar (md+), bottom tab bar (mobile) and the "More" sheet.
 *
 * - `permission` undefined  → visible to every signed-in role.
 * - `permission` set        → hidden unless `can(role, permission)` is true.
 * - `primary`               → shown directly in the mobile bottom tab bar.
 *
 * View access for Players/Matches is open to all roles (VIEWER is read-only);
 * write gating happens inside each feature page, not in the nav.
 */
export type AdminNavItem = Readonly<{
  href: string;
  label: string;
  icon: LucideIcon;
  permission?: Permission;
  primary?: boolean;
  /** `data-tour` id for the welcome/shell tour (spec §8). */
  tourId?: string;
}>;

export const ADMIN_NAV_ITEMS: readonly AdminNavItem[] = [
  {
    href: "/admin",
    label: "Dashboard",
    icon: LayoutDashboard,
    primary: true,
    tourId: "nav-dashboard",
  },
  {
    href: "/admin/matches",
    label: "Matches",
    icon: CalendarDays,
    primary: true,
    tourId: "nav-matches",
  },
  {
    href: "/admin/players",
    label: "Players",
    icon: Users,
    primary: true,
    tourId: "nav-players",
  },
  {
    href: "/admin/club",
    label: "Club",
    icon: Settings,
    permission: "club:edit",
  },
  {
    href: "/admin/users",
    label: "Users",
    icon: UserCog,
    permission: "user:manage",
  },
  {
    href: "/admin/help",
    label: "คู่มือ",
    icon: LifeBuoy,
    permission: "dashboard:view",
  },
];

function isVisible(item: AdminNavItem, role: Role): boolean {
  return item.permission ? can(role, item.permission) : true;
}

/** All destinations the given role may see. */
export function visibleNavItems(role: Role): AdminNavItem[] {
  return ADMIN_NAV_ITEMS.filter((item) => isVisible(item, role));
}

/** Destinations shown directly in the mobile bottom tab bar. */
export function primaryNavItems(role: Role): AdminNavItem[] {
  return visibleNavItems(role).filter((item) => item.primary);
}

/** Destinations that overflow into the mobile "More" sheet. */
export function moreNavItems(role: Role): AdminNavItem[] {
  return visibleNavItems(role).filter((item) => !item.primary);
}

/** Match the active nav item for a pathname (longest-prefix, `/admin` exact). */
export function isNavItemActive(href: string, pathname: string): boolean {
  if (href === "/admin") {
    return pathname === "/admin";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}
