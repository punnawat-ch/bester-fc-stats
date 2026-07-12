"use server";

import { randomUUID } from "node:crypto";

import { revalidatePath } from "next/cache";

import { Prisma } from "@prisma/client";

import { requireUser } from "@/lib/auth-guard";
import { getClub } from "@/lib/football";
import { recomputePlayerAggregates } from "@/lib/player-stats";
import { prisma } from "@/lib/prisma";
import { ForbiddenError } from "@/lib/rbac";

import {
  buildKickoff,
  combineDateTime,
  expandWeekly,
  incrementMatchweek,
  resultFromScore,
} from "./lib";
import {
  LINEUP_STAT_KEYS,
  markPlayedSchema,
  matchFormSchema,
  scopeSchema,
  type LineupEntryValues,
  type MatchFormValues,
  type SeriesScope,
} from "./schema";

export type ActionResult =
  | { ok: true; count?: number }
  | { ok: false; error: string };

function revalidate(): void {
  revalidatePath("/");
  revalidatePath("/admin/matches");
}

/** Run a guarded mutation, translating known errors into a typed result. */
async function guarded(
  run: () => Promise<ActionResult>,
): Promise<ActionResult> {
  try {
    await requireUser("match:write");
    return await run();
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return { ok: false, error: "FORBIDDEN" };
    }
    return { ok: false, error: "SERVER_ERROR" };
  }
}

type CommonFields = {
  opponent: string;
  matchweek: string | null;
  venue: string | null;
  field: string | null;
  kickoff: string | null;
  notes: string | null;
};

function commonFields(data: MatchFormValues): CommonFields {
  return {
    opponent: data.opponent,
    matchweek: data.matchweek.trim() === "" ? null : data.matchweek.trim(),
    venue: data.venue.trim() === "" ? null : data.venue.trim(),
    field: data.field.trim() === "" ? null : data.field.trim(),
    kickoff: data.allDay ? null : buildKickoff(data.startTime, data.endTime),
    notes: data.notes.trim() === "" ? null : data.notes.trim(),
  };
}

/**
 * Create a single fixture, or expand a weekly recurrence into N fixtures that
 * share one `seriesId`. Single events store `seriesId = null`.
 */
export async function createMatch(input: unknown): Promise<ActionResult> {
  return guarded(async () => {
    const parsed = matchFormSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: "VALIDATION" };
    }
    const data = parsed.data;
    const club = await getClub();
    const startTime = data.allDay ? null : data.startTime;
    const base = combineDateTime(data.date, startTime);
    const common = commonFields(data);

    if (data.recurrence?.enabled) {
      const until = combineDateTime(data.recurrence.until, startTime);
      const dates = expandWeekly(base, until);
      if (dates.length === 0) {
        return { ok: false, error: "VALIDATION" };
      }
      const seriesId = randomUUID();
      await prisma.match.createMany({
        data: dates.map((date, index) => ({
          clubId: club.id,
          date,
          status: "SCHEDULED" as const,
          seriesId,
          ...common,
          matchweek: incrementMatchweek(common.matchweek, index),
        })),
      });
      revalidate();
      return { ok: true, count: dates.length };
    }

    await prisma.match.create({
      data: {
        clubId: club.id,
        date: base,
        status: "SCHEDULED",
        seriesId: null,
        ...common,
      },
    });
    revalidate();
    return { ok: true, count: 1 };
  });
}

function resolveScope(
  hasSeries: boolean,
  scope: SeriesScope | undefined,
): SeriesScope {
  if (!hasSeries || !scope) {
    return "this";
  }
  return scope;
}

/**
 * Update a fixture. For a series, `scope` selects which occurrences change:
 *  - "this": edit only this row (and detach it from the series);
 *  - "following": edit shared fields on this row + later rows in the series;
 *  - "all": edit shared fields across the whole series.
 * The calendar date is only moved for the "this" scope.
 */
export async function updateMatch(
  input: unknown,
  scope?: SeriesScope,
): Promise<ActionResult> {
  return guarded(async () => {
    const parsed = matchFormSchema.safeParse(input);
    const parsedScope = scope ? scopeSchema.safeParse(scope) : null;
    const id = typeof input === "object" && input && "id" in input
      ? String((input as { id: unknown }).id ?? "")
      : "";
    if (!parsed.success || !id) {
      return { ok: false, error: "VALIDATION" };
    }
    if (parsedScope && !parsedScope.success) {
      return { ok: false, error: "VALIDATION" };
    }

    const existing = await prisma.match.findUnique({ where: { id } });
    if (!existing) {
      return { ok: false, error: "NOT_FOUND" };
    }

    const data = parsed.data;
    const common = commonFields(data);
    const effectiveScope = resolveScope(
      Boolean(existing.seriesId),
      parsedScope?.success ? parsedScope.data : undefined,
    );

    if (existing.seriesId && effectiveScope !== "this") {
      const where =
        effectiveScope === "all"
          ? { seriesId: existing.seriesId }
          : { seriesId: existing.seriesId, date: { gte: existing.date } };
      const result = await prisma.match.updateMany({ where, data: common });
      revalidate();
      return { ok: true, count: result.count };
    }

    const startTime = data.allDay ? null : data.startTime;
    await prisma.match.update({
      where: { id },
      data: {
        ...common,
        date: combineDateTime(data.date, startTime),
        seriesId: null,
      },
    });
    revalidate();
    return { ok: true, count: 1 };
  });
}

/**
 * Delete a fixture. For a series, `scope` deletes this / this-and-following /
 * all occurrences that share the `seriesId`.
 */
export async function deleteMatch(
  id: string,
  scope?: SeriesScope,
): Promise<ActionResult> {
  return guarded(async () => {
    if (!id) {
      return { ok: false, error: "VALIDATION" };
    }
    const existing = await prisma.match.findUnique({ where: { id } });
    if (!existing) {
      return { ok: false, error: "NOT_FOUND" };
    }

    const effectiveScope = resolveScope(Boolean(existing.seriesId), scope);
    if (existing.seriesId && effectiveScope !== "this") {
      const where =
        effectiveScope === "all"
          ? { seriesId: existing.seriesId }
          : { seriesId: existing.seriesId, date: { gte: existing.date } };
      const targets = await prisma.match.findMany({ where, select: { id: true } });
      const affected = await lineupPlayerIds(targets.map((match) => match.id));
      const result = await prisma.match.deleteMany({ where });
      await recomputePlayerAggregates(affected);
      revalidate();
      revalidatePath("/admin/players");
      return { ok: true, count: result.count };
    }

    const affected = await lineupPlayerIds([id]);
    await prisma.match.delete({ where: { id } });
    await recomputePlayerAggregates(affected);
    revalidate();
    revalidatePath("/admin/players");
    return { ok: true, count: 1 };
  });
}

/** Player ids appearing in the lineups of the given matches (for stat recompute). */
async function lineupPlayerIds(matchIds: readonly string[]): Promise<string[]> {
  if (matchIds.length === 0) {
    return [];
  }
  const rows = await prisma.matchPlayer.findMany({
    where: { matchId: { in: [...matchIds] } },
    select: { playerId: true },
  });
  return rows.map((row) => row.playerId);
}

/** A lineup entry resolved to a concrete player id + its per-match stats. */
type ResolvedLineupRow = { playerId: string } & Record<
  (typeof LINEUP_STAT_KEYS)[number],
  number
>;

/** Extract just the numeric per-match stat fields from a validated entry. */
function pickStats(
  entry: LineupEntryValues,
): Record<(typeof LINEUP_STAT_KEYS)[number], number> {
  const stats = {} as Record<(typeof LINEUP_STAT_KEYS)[number], number>;
  for (const key of LINEUP_STAT_KEYS) {
    stats[key] = entry[key];
  }
  return stats;
}

/**
 * Turn raw lineup entries into concrete player rows, creating brand-new players
 * on the fly (upsert-by-name reuses an existing player of the same name). Entries
 * whose `playerId` is not in this club are dropped. Duplicate players collapse to
 * the last entry so the caller never violates the `(matchId, playerId)` unique.
 */
async function resolveLineup(
  tx: Prisma.TransactionClient,
  clubId: string,
  entries: readonly LineupEntryValues[],
): Promise<ResolvedLineupRow[]> {
  const clubPlayers = await tx.player.findMany({
    where: { clubId },
    select: { id: true },
  });
  const validIds = new Set(clubPlayers.map((player) => player.id));
  const byPlayer = new Map<string, ResolvedLineupRow>();

  for (const entry of entries) {
    let playerId: string;
    if (entry.newPlayerName) {
      const name = entry.newPlayerName.trim();
      const player = await tx.player.upsert({
        where: { clubId_name: { clubId, name } },
        create: { clubId, name },
        update: {},
        select: { id: true },
      });
      playerId = player.id;
    } else if (entry.playerId && validIds.has(entry.playerId)) {
      playerId = entry.playerId;
    } else {
      continue;
    }
    byPlayer.set(playerId, { playerId, ...pickStats(entry) });
  }

  return [...byPlayer.values()];
}

/**
 * Transition a fixture to PLAYED, storing the score and deriving the result
 * (WIN/DRAW/LOSS) unless an explicit override is supplied. Also replaces the
 * match's player lineup (creating new players inline) and recomputes the
 * affected players' cached aggregate stats. Safe to re-run to edit a result.
 */
export async function markMatchPlayed(
  id: string,
  input: unknown,
): Promise<ActionResult> {
  return guarded(async () => {
    const parsed = markPlayedSchema.safeParse(input);
    if (!id || !parsed.success) {
      return { ok: false, error: "VALIDATION" };
    }
    const club = await getClub();
    const existing = await prisma.match.findFirst({
      where: { id, clubId: club.id },
      select: { id: true, lineup: { select: { playerId: true } } },
    });
    if (!existing) {
      return { ok: false, error: "NOT_FOUND" };
    }

    const { goalsFor, goalsAgainst, result, lineup } = parsed.data;

    const affected = await prisma.$transaction(async (tx) => {
      const rows = await resolveLineup(tx, club.id, lineup);
      await tx.matchPlayer.deleteMany({ where: { matchId: id } });
      if (rows.length > 0) {
        await tx.matchPlayer.createMany({
          data: rows.map((row) => ({ matchId: id, ...row })),
        });
      }
      await tx.match.update({
        where: { id },
        data: {
          status: "PLAYED",
          goalsFor,
          goalsAgainst,
          result: result ?? resultFromScore(goalsFor, goalsAgainst),
        },
      });
      // Recompute everyone previously in this lineup (in case they were removed)
      // plus everyone now in it.
      return [
        ...existing.lineup.map((row) => row.playerId),
        ...rows.map((row) => row.playerId),
      ];
    });

    await recomputePlayerAggregates(affected);
    revalidate();
    revalidatePath("/admin/players");
    return { ok: true };
  });
}
