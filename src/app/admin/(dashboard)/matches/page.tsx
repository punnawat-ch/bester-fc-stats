import type { Metadata } from "next";

import { requireUser } from "@/lib/auth-guard";
import { getClub } from "@/lib/football";
import { prisma } from "@/lib/prisma";
import { can } from "@/lib/rbac";

import { toMatchDTO } from "./lib";
import { MatchesClient } from "./matches-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Matches",
  robots: { index: false, follow: false },
};

/**
 * Matches — Google-Calendar-style schedule (admin-ux-spec §4.5). Every logged
 * in role can view; `match:write` gates create/edit/delete/mark. Data is read
 * directly from Prisma and serialised to plain DTOs for the client calendar.
 */
export default async function AdminMatchesPage() {
  const session = await requireUser();
  const club = await getClub();
  const matches = await prisma.match.findMany({
    where: { clubId: club.id },
    orderBy: { date: "asc" },
  });
  const canWrite = can(session.user.role, "match:write");

  return <MatchesClient matches={matches.map(toMatchDTO)} canWrite={canWrite} />;
}
