import { cache } from "react";

import { footballStats } from "../data/football-stats";

export type TeamStats = typeof footballStats.teamStats;
export type PlayerStats = (typeof footballStats.playerStats)[number];

export const getFootballStats = cache(() => footballStats);

export const getTopPerformers = cache(() => {
  const players = footballStats.playerStats;

  const topScorer = players.reduce((current, player) =>
    player.goals > current.goals ? player : current,
  );

  const topAssist = players.reduce((current, player) =>
    player.assists > current.assists ? player : current,
  );

  return {
    topScorer,
    topAssist,
  };
});

export const getGoalSummary = cache(() => {
  const goalsFor = footballStats.playerStats.reduce(
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
});

