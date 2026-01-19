import type { TeamStats } from "../lib/football";
import StatBadge from "./StatBadge";

type TeamStatsCardsProps = {
  teamStats: TeamStats;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
};

// Server component: pulls static team aggregates without client state.
export default function TeamStatsCards({
  teamStats,
  goalsFor,
  goalsAgainst,
  goalDifference,
}: TeamStatsCardsProps) {
  return (
    <section className="grid w-full grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
      <StatBadge label="Matches" value={teamStats.matchesPlayed} size="sm" />
      <StatBadge label="Wins" value={teamStats.wins} tone="success" size="sm" />
      <StatBadge label="Draws" value={teamStats.draws} tone="warning" size="sm" />
      <StatBadge label="Losses" value={teamStats.losses} tone="danger" size="sm" />
      <StatBadge label="GF" value={goalsFor} size="sm" />
      <StatBadge label="GA" value={goalsAgainst} tone="warning" size="sm" />
      <StatBadge label="GD" value={goalDifference} tone="success" size="sm" />
    </section>
  );
}

