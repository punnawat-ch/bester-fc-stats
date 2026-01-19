import ClubHeader from "../components/ClubHeader";
import PlayerStatsTable from "../components/PlayerStatsTable";
import TeamStatsCards from "../components/TeamStatsCards";
import { getFootballStats, getGoalSummary } from "../lib/football";

// Server component: all data is read on the server for fast first paint.
export default function Home() {
  const stats = getFootballStats();
  const { goalsFor, goalsAgainst, goalDifference } = getGoalSummary();

  return (
    <div className="relative min-h-screen pitch-bg">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,_rgba(16,185,129,0.18),_transparent_55%)]" />
      <main className="relative mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-10 lg:px-10 lg:py-14">
        <ClubHeader
          clubName={stats.club}
          recordedAt={stats.recordedAt}
          teamStats={stats.teamStats}
        />
        <TeamStatsCards
          teamStats={stats.teamStats}
          goalsFor={goalsFor}
          goalsAgainst={goalsAgainst}
          goalDifference={goalDifference}
        />
        <PlayerStatsTable players={stats.playerStats} />
      </main>
    </div>
  );
}
