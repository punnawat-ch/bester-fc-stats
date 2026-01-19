export const dynamic = "force-dynamic";

import ClubHeader from "../components/ClubHeader";
import MatchHistoryTable from "../components/MatchHistoryTable";
import PlayerStatsTable from "../components/PlayerStatsTable";
import TopBar from "../components/TopBar";
import TeamStatsCards from "../components/TeamStatsCards";
import { getFootballStats, getGoalSummary } from "../lib/football";

// Server component: all data is read on the server for fast first paint.
export default async function Home() {
  const stats = await getFootballStats();
  const { goalsFor, goalsAgainst, goalDifference } = getGoalSummary(stats);

  return (
    <div className="relative min-h-screen pitch-bg">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(37,99,235,0.24),transparent_55%)]" />
      <TopBar />
      <main className="relative mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-10 lg:px-10 lg:py-14">
        <section id="overview" className="scroll-mt-24">
          <ClubHeader
            clubName={stats.club}
            recordedAt={stats.recordedAt}
            teamStats={stats.teamStats}
          />
        </section>
        <section className="scroll-mt-24">
          <TeamStatsCards
            teamStats={stats.teamStats}
            goalsFor={goalsFor}
            goalsAgainst={goalsAgainst}
            goalDifference={goalDifference}
          />
        </section>
        <section id="matches" className="scroll-mt-24">
          <MatchHistoryTable
            matchHistory={stats.matchHistory}
            clubName={stats.club}
          />
        </section>
        <section id="ranking" className="scroll-mt-24">
          <PlayerStatsTable players={stats.playerStats} />
        </section>
      </main>
    </div>
  );
}
