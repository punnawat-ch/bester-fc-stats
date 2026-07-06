"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Role } from "@prisma/client";
import { LogOut, MoreHorizontal } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { isNavItemActive, moreNavItems } from "./nav-config";
import { signOutToLogin } from "./sign-out";

type AdminMoreMenuProps = Readonly<{
  role: Role;
}>;

/** Mobile "More" tab → bottom-sheet with overflow destinations + sign out. */
export function AdminMoreMenu({ role }: AdminMoreMenuProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const items = moreNavItems(role);
  const active = items.some((item) => isNavItemActive(item.href, pathname));

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        className={cn(
          "flex min-h-[56px] flex-1 flex-col items-center justify-center gap-1 outline-none focus-visible:ring-2 focus-visible:ring-sky-400/70",
          active ? "text-sky-300" : "text-white/50",
        )}
      >
        <MoreHorizontal className="size-6" aria-hidden="true" />
        <span className="text-[10px]">More</span>
      </SheetTrigger>
      <SheetContent side="bottom">
        <SheetHeader>
          <SheetTitle>More</SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col gap-1 pb-safe">
          {items.map((item) => {
            const Icon = item.icon;
            const itemActive = isNavItemActive(item.href, pathname);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                aria-current={itemActive ? "page" : undefined}
                className={cn(
                  "flex min-h-12 items-center gap-3 rounded-2xl px-3 text-sm transition",
                  itemActive
                    ? "bg-sky-500/15 text-white"
                    : "text-white/70 hover:bg-white/5 hover:text-white",
                )}
              >
                <Icon
                  className={cn("size-5", itemActive ? "text-sky-300" : "")}
                  aria-hidden="true"
                />
                {item.label}
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => {
              signOutToLogin().catch(() => {});
            }}
            className="flex min-h-12 items-center gap-3 rounded-2xl px-3 text-sm text-rose-200 transition hover:bg-rose-500/15"
          >
            <LogOut className="size-5" aria-hidden="true" />
            Sign out
          </button>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
