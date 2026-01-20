export const dynamic = "force-dynamic";

import ClubHeader from "../components/ClubHeader";
import MatchHistoryTable from "../components/MatchHistoryTable";
import MatchScheduleTimeline from "../components/MatchScheduleTimeline";
import PlayerStatsTable from "../components/PlayerStatsTable";
import TopBar from "../components/TopBar";
import TeamStatsCards from "../components/TeamStatsCards";
import { matchSchedule } from "../data/match-schedule";
import { getFootballStats, getGoalSummary } from "../lib/football";

// Server component: all data is read on the server for fast first paint.
export default async function Home() {
  const stats = await getFootballStats();
  const { goalsFor, goalsAgainst, goalDifference } = getGoalSummary(stats);

  return (
    <div className="relative min-h-screen pitch-bg">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(56,189,248,0.22),transparent_60%)]" />
      <div className="sticky top-4 z-50 mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-10">
        <TopBar />
      </div>
      <main className="relative mx-auto w-full max-w-6xl px-4 pb-8 pt-6 sm:px-6 lg:px-10 lg:pb-12 lg:pt-10">
        <div className="rounded-[32px] border border-white/10 p-4 shadow-[0_30px_90px_rgba(0,0,0,0.45)]  sm:p-6 lg:p-8">
          <div className="mt-6 flex flex-col gap-6">
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
            <section className="scroll-mt-24">
              <MatchScheduleTimeline schedule={matchSchedule} />
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
