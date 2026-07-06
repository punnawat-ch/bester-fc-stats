"use client";

import Image from "next/image";
import type { Role } from "@prisma/client";
import { LogOut } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOutToLogin } from "./sign-out";

type AdminTopBarProps = Readonly<{
  shortName: string;
  crestUrl: string | null;
  userName: string | null;
  userEmail: string | null;
  role: Role;
}>;

const ROLE_VARIANT: Record<Role, "info" | "neutral"> = {
  ADMIN: "info",
  EDITOR: "neutral",
  VIEWER: "neutral",
};

function initialOf(name: string | null, email: string | null): string {
  const source = name ?? email ?? "?";
  return source.trim().charAt(0).toUpperCase() || "?";
}

export function AdminTopBar({
  shortName,
  crestUrl,
  userName,
  userEmail,
  role,
}: AdminTopBarProps) {
  const logoSrc = crestUrl ?? "/logo.png";
  const displayName = userName ?? userEmail ?? "Account";

  return (
    <header className="sticky top-0 z-30 flex h-[52px] items-center justify-between border-b border-white/10 bg-[#0a1222]/80 px-4 backdrop-blur-2xl">
      <div className="flex items-center gap-2">
        <Image
          src={logoSrc}
          alt={shortName}
          width={28}
          height={28}
          className="h-7 w-7 rounded-lg bg-white/90 p-0.5"
        />
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-semibold text-white">{shortName}</span>
          <span className="text-[10px] uppercase tracking-[0.24em] text-white/50">
            Admin
          </span>
        </div>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger
          data-tour="topbar-signout"
          className="flex h-11 items-center gap-2 rounded-full border border-white/10 bg-white/5 pr-3 pl-1.5 text-white outline-none transition hover:border-white/30 focus-visible:ring-2 focus-visible:ring-sky-400/70"
          aria-label="Account menu"
        >
          <span className="flex size-8 items-center justify-center rounded-full bg-sky-500/20 text-sm font-semibold text-sky-200">
            {initialOf(userName, userEmail)}
          </span>
          <span className="hidden max-w-[10rem] truncate text-sm sm:block">
            {displayName}
          </span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-56">
          <DropdownMenuLabel>Signed in</DropdownMenuLabel>
          <div className="flex flex-col gap-1.5 px-3 pb-2">
            <span className="truncate text-sm font-medium text-white">
              {displayName}
            </span>
            {userEmail ? (
              <span className="truncate text-xs text-white/50">
                {userEmail}
              </span>
            ) : null}
            <Badge variant={ROLE_VARIANT[role]} className="mt-1">
              {role}
            </Badge>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onSelect={() => {
              signOutToLogin().catch(() => {});
            }}
          >
            <LogOut />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
