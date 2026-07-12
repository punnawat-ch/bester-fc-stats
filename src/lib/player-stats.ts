import "server-only";

import { prisma } from "./prisma";

/**
 * Player.* stat columns (matchesPlayed, goals, assists, cleanSheets, yellow/red,
 * motm, saves) are a *cached rollup* of the player's per-match `MatchPlayer` rows
 * (auto-sum). They are never edited by hand — recompute them here whenever a
 * match lineup changes so every reader (public squad, admin list) stays correct.
 *
 * `matchesPlayed` = number of matches the player appears in (row count).
 */
export async function recomputePlayerAggregates(
  playerIds: readonly string[],
): Promise<void> {
  const unique = [...new Set(playerIds)].filter(Boolean);
  if (unique.length === 0) {
    return;
  }

  await Promise.all(
    unique.map(async (playerId) => {
      const rollup = await prisma.matchPlayer.aggregate({
        where: { playerId },
        _sum: {
          goals: true,
          assists: true,
          cleanSheets: true,
          yellowCards: true,
          redCards: true,
          motm: true,
          saves: true,
        },
        _count: { _all: true },
      });

      const sum = rollup._sum;
      await prisma.player.update({
        where: { id: playerId },
        data: {
          matchesPlayed: rollup._count._all,
          goals: sum.goals ?? 0,
          assists: sum.assists ?? 0,
          cleanSheets: sum.cleanSheets ?? 0,
          yellowCards: sum.yellowCards ?? 0,
          redCards: sum.redCards ?? 0,
          motm: sum.motm ?? 0,
          saves: sum.saves ?? 0,
        },
      });
    }),
  );
}
