"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Role } from "@prisma/client";

import { cn } from "@/lib/utils";
import { AdminMoreMenu } from "./AdminMoreMenu";
import { isNavItemActive, primaryNavItems } from "./nav-config";

type AdminBottomNavProps = Readonly<{
  role: Role;
}>;

/**
 * Mobile bottom tab bar (admin-ux-spec §2.2): fixed, safe-area aware, >=56px
 * targets. Primary destinations + a "More" sheet. Hidden from `md` (sidebar).
 */
export function AdminBottomNav({ role }: AdminBottomNavProps) {
  const pathname = usePathname();
  const items = primaryNavItems(role);

  return (
    <nav
      aria-label="Admin"
      className="pb-safe fixed inset-x-0 bottom-0 z-40 flex items-stretch border-t border-white/10 bg-[#0a1222]/90 backdrop-blur-2xl md:hidden"
    >
      {items.map((item) => {
        const active = isNavItemActive(item.href, pathname);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            data-tour={item.tourId}
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative flex min-h-[56px] flex-1 flex-col items-center justify-center gap-1 outline-none focus-visible:ring-2 focus-visible:ring-sky-400/70",
              active ? "text-sky-300" : "text-white/50",
            )}
          >
            {active ? (
              <span
                aria-hidden="true"
                className="absolute top-0 h-0.5 w-8 rounded-full bg-sky-300 shadow-[0_0_12px_rgba(56,189,248,0.8)]"
              />
            ) : null}
            <Icon className="size-6" aria-hidden="true" />
            <span className="text-[10px]">{item.label}</span>
          </Link>
        );
      })}
      <AdminMoreMenu role={role} />
    </nav>
  );
}
