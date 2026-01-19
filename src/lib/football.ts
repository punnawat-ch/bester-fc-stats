import type { FootballStats } from "../data/football-stats";
import { fetchFootballStatsFromSheet } from "./google-sheets";

export type TeamStats = FootballStats["teamStats"];
export type PlayerStats = FootballStats["playerStats"][number];

export async function getFootballStats(): Promise<FootballStats> {
  return fetchFootballStatsFromSheet();
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
  const goalsFor = stats.playerStats.reduce(
    (total, player) => total + player.goals,
    0,
  );
  const goalsAgainst = 0;
  const goalDifference = goalsFor - goalsAgainst;

  return {
    goalsFor,
    goalsAgainst,
    goalDifference,
  };
}

