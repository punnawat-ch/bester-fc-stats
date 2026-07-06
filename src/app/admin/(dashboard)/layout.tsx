import type { ReactNode } from "react";

import { requireUser } from "@/lib/auth-guard";
import { getClub } from "@/lib/football";
import { prisma } from "@/lib/prisma";
import { AdminBottomNav } from "@/components/admin/shell/AdminBottomNav";
import { AdminSidebar } from "@/components/admin/shell/AdminSidebar";
import { AdminTopBar } from "@/components/admin/shell/AdminTopBar";
import { TutorialPrefsProvider } from "@/components/admin/help/tutorial-prefs";
import { Toaster } from "@/components/ui/sonner";

export const dynamic = "force-dynamic";

/**
 * Admin shell (admin-ux-spec §4.2). Guards every route in the `(dashboard)`
 * group: `requireUser()` redirects to `/admin/login` when there is no session.
 * `/admin/login` sits OUTSIDE this route group, so it stays public (no loop).
 *
 * Mobile-first: top bar + bottom tab bar; from `md` a fixed left sidebar
 * replaces the tab bar and content shifts right (`md:ml-64`). The Sonner
 * `<Toaster />` is mounted once here for Wave 4 pages to toast.
 */
export default async function AdminDashboardLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  const session = await requireUser();
  const club = await getClub();
  const { role, name, email } = session.user;

  const prefs = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { tutorialEnabled: true, toursSeen: true },
  });
  const tutorialEnabled = prefs?.tutorialEnabled ?? true;
  const toursSeen = prefs?.toursSeen ?? [];

  return (
    <TutorialPrefsProvider
      tutorialEnabled={tutorialEnabled}
      toursSeen={toursSeen}
    >
      <div className="admin-ambient min-h-dvh text-white">
        <AdminSidebar role={role} />

        <div className="flex min-h-dvh flex-col md:ml-64">
          <AdminTopBar
            shortName={club.shortName}
            crestUrl={club.crestUrl}
            userName={name ?? null}
            userEmail={email ?? null}
            role={role}
          />
          <main className="mx-auto w-full max-w-5xl flex-1 px-4 pt-5 pb-28 md:px-6 md:pb-10">
            {children}
          </main>
        </div>

        <AdminBottomNav role={role} />
        <Toaster />
      </div>
    </TutorialPrefsProvider>
  );
}
