import "server-only";

import type { MatchResult, Match as PrismaMatch } from "@prisma/client";

import type { FootballStats } from "../data/football-stats";
import { prisma } from "./prisma";
import type { ScheduleMatch, SquadPlayer } from "./types";

export type TeamStats = FootballStats["teamStats"];
export type PlayerStats = FootballStats["playerStats"][number];

const RESULT_LABEL: Record<MatchResult, string> = {
  WIN: "Win",
  DRAW: "Draw",
  LOSS: "Loss",
};

export async function getFootballStats(): Promise<FootballStats> {
  const club = await prisma.club.findFirstOrThrow({
    include: {
      players: { orderBy: [{ goals: "desc" }, { sortOrder: "asc" }] },
      matches: { where: { status: "PLAYED" }, orderBy: { date: "desc" } },
    },
  });

  // teamStats: derive จาก matches ที่ PLAYED
  const played = club.matches;
  const goalsFor = played.reduce((sum, m) => sum + (m.goalsFor ?? 0), 0);
  const goalsAgainst = played.reduce((sum, m) => sum + (m.goalsAgainst ?? 0), 0);
  const teamStats: TeamStats = {
    matchesPlayed: played.length,
    wins: played.filter((m) => m.result === "WIN").length,
    draws: played.filter((m) => m.result === "DRAW").length,
    losses: played.filter((m) => m.result === "LOSS").length,
    goalsFor,
    goalsAgainst,
    goalDifference: goalsFor - goalsAgainst,
  };

  return {
    club: club.name,
    recordedAt: club.recordedAt.toISOString(),
    teamStats,
    playerStats: club.players.map((p) => ({
      name: p.name,
      goals: p.goals,
      assists: p.assists,
      matchesPlayed: p.matchesPlayed,
      cleanSheets: p.cleanSheets,
    })),
    matchHistory: played.map((m) => ({
      date: m.matchweek ?? m.date.toISOString(),
      versus: m.opponent,
      score: m.goalsFor != null ? `${m.goalsFor}-${m.goalsAgainst}` : "N/A",
      result: m.result ? RESULT_LABEL[m.result] : "N/A",
    })),
  };
}

/**
 * Richer per-player card data for the public Squad flip cards (Wave 5.3).
 * Additive to getFootballStats — does not change the FootballStats DTO.
 * Players ordered goals desc → sortOrder asc.
 */
export async function getSquad(): Promise<SquadPlayer[]> {
  const club = await prisma.club.findFirstOrThrow({
    include: {
      players: { orderBy: [{ goals: "desc" }, { sortOrder: "asc" }] },
    },
  });

  return club.players.map((p) => ({
    id: p.id,
    name: p.name,
    nickname: p.nickname,
    position: p.position,
    jerseyNumber: p.jerseyNumber,
    imageUrl: p.imageUrl,
    goals: p.goals,
    assists: p.assists,
    matchesPlayed: p.matchesPlayed,
    cleanSheets: p.cleanSheets,
    yellowCards: p.yellowCards,
    redCards: p.redCards,
    motm: p.motm,
    saves: p.saves,
  }));
}

function toScheduleMonth(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    year: "numeric",
  }).format(date);
}

function toScheduleDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = String(date.getFullYear()).slice(-2);
  return `${day}/${month}/${year}`;
}

function toScheduleMatch(match: PrismaMatch): ScheduleMatch {
  return {
    month: toScheduleMonth(match.date),
    week: match.matchweek ?? "",
    date: toScheduleDate(match.date),
    opponent: match.opponent,
    venue: match.venue ?? "",
    field: match.field ?? undefined,
    time: match.kickoff ?? "",
    notes: match.notes ?? undefined,
  };
}

// schedule: เดิม hardcode → อ่านจาก DB
export async function getMatchSchedule(clubId: string): Promise<ScheduleMatch[]> {
  const matches = await prisma.match.findMany({
    where: { clubId, status: "SCHEDULED" },
    orderBy: { date: "asc" },
  });
  return matches.map(toScheduleMatch);
}

// club branding สำหรับ TopBar / ClubHeader / metadata
export async function getClub() {
  return prisma.club.findFirstOrThrow();
}

export function getTopPerformers(stats: FootballStats) {
  const fallback = stats.playerStats[0] ?? {
    name: "Unknown",
    goals: 0,
    assists: 0,
    cleanSheets: 0,
  };

  const topScorer = stats.playerStats.reduce(
    (current, player) => (player.goals > current.goals ? player : current),
    fallback,
  );

  const topAssist = stats.playerStats.reduce(
    (current, player) => (player.assists > current.assists ? player : current),
    fallback,
  );

  return {
    topScorer,
    topAssist,
  };
}

export function getGoalSummary(stats: FootballStats) {
  const goalsFor = stats.teamStats.goalsFor ?? 0;
  const goalsAgainst = stats.teamStats.goalsAgainst ?? 0;
  const goalDifference = stats.teamStats.goalDifference ?? goalsFor - goalsAgainst;

  return {
    goalsFor,
    goalsAgainst,
    goalDifference,
  };
}
