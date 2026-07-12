/**
 * One-off "clean switch" for the match↔player rollup.
 *
 * After this feature, every Player.* stat total (matchesPlayed, goals, assists,
 * cleanSheets, yellow/red, motm, saves) is a cached sum of that player's
 * MatchPlayer rows. Legacy players still carry their old hand-entered totals
 * until a match touches them. Run this once to make everyone consistent now:
 *
 *   pnpm tsx prisma/recompute-player-stats.ts
 *
 * Players with no lineups yet will reset to 0 — backfill past matches' lineups
 * (via a match's "Mark as played" / "Edit result & lineup") to restore numbers.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const players = await prisma.player.findMany({ select: { id: true } });

  for (const { id } of players) {
    const rollup = await prisma.matchPlayer.aggregate({
      where: { playerId: id },
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
      where: { id },
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
  }

  console.log(`Recomputed aggregates for ${players.length} player(s).`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
