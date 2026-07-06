"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Role } from "@prisma/client";
import { LogOut } from "lucide-react";

import { cn } from "@/lib/utils";
import { isNavItemActive, visibleNavItems } from "./nav-config";
import { signOutToLogin } from "./sign-out";

type AdminSidebarProps = Readonly<{
  role: Role;
}>;

/** Desktop (md+) left sidebar. Hidden on mobile, where the bottom tab bar is used. */
export function AdminSidebar({ role }: AdminSidebarProps) {
  const pathname = usePathname();
  const items = visibleNavItems(role);

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-white/10 bg-[#0a1222]/80 backdrop-blur-2xl md:flex">
      <div className="flex h-[52px] items-center gap-2 border-b border-white/10 px-5">
        <span className="text-sm font-semibold text-white">Bester FC</span>
        <span className="text-[10px] uppercase tracking-[0.24em] text-white/50">
          Admin
        </span>
      </div>

      <nav className="flex flex-1 flex-col gap-1 p-3">
        {items.map((item) => {
          const active = isNavItemActive(item.href, pathname);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-h-11 items-center gap-3 rounded-2xl px-3 text-sm transition outline-none focus-visible:ring-2 focus-visible:ring-sky-400/70",
                active
                  ? "glow-ring bg-sky-500/15 text-white"
                  : "text-white/60 hover:bg-white/5 hover:text-white",
              )}
            >
              <Icon
                className={cn("size-5", active ? "text-sky-300" : "")}
                aria-hidden="true"
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-3">
        <button
          type="button"
          onClick={() => {
            signOutToLogin().catch(() => {});
          }}
          className="flex min-h-11 w-full items-center gap-3 rounded-2xl px-3 text-sm text-white/60 transition outline-none hover:bg-white/5 hover:text-white focus-visible:ring-2 focus-visible:ring-sky-400/70"
        >
          <LogOut className="size-5" aria-hidden="true" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
