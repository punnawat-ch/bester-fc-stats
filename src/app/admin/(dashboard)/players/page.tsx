import type { Metadata } from "next";

import { requireUser } from "@/lib/auth-guard";
import { getClub } from "@/lib/football";
import { prisma } from "@/lib/prisma";
import { can } from "@/lib/rbac";
import { PlayersManager } from "./players-manager";
import type { PlayerDTO } from "./types";

export const metadata: Metadata = {
  title: "Players",
  robots: { index: false, follow: false },
};

/**
 * Players list (admin-ux-spec §4.4). Any signed-in role may view; only
 * `player:write` roles get create/edit/delete affordances. Ordered by goals
 * desc then sortOrder asc — the same order the public squad table uses.
 */
export default async function PlayersPage() {
  const session = await requireUser();
  const club = await getClub();

  const players = await prisma.player.findMany({
    where: { clubId: club.id },
    orderBy: [{ goals: "desc" }, { sortOrder: "asc" }],
  });

  const items: readonly PlayerDTO[] = players.map((player) => ({
    id: player.id,
    name: player.name,
    matchesPlayed: player.matchesPlayed,
    goals: player.goals,
    assists: player.assists,
    cleanSheets: player.cleanSheets,
    sortOrder: player.sortOrder,
  }));

  const canWrite = can(session.user.role, "player:write");

  return <PlayersManager players={items} canWrite={canWrite} />;
}
