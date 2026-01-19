import type { TeamStats } from "../lib/football";

type ClubHeaderProps = {
  clubName: string;
  recordedAt: string;
  teamStats: TeamStats;
};

// Server component: data is read and formatted on the server for SEO + performance.
export default function ClubHeader({
  clubName,
  recordedAt,
  teamStats,
}: ClubHeaderProps) {
  const matchSummary = `${teamStats.matchesPlayed} MP · ${teamStats.wins} W · ${teamStats.draws} D · ${teamStats.losses} L`;
  const formattedDate = new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(recordedAt));

  return (
    <header className="relative overflow-hidden rounded-3xl border border-emerald-400/20 bg-gradient-to-br from-[#0b1a12] via-[#0f2a1b] to-[#142c1c] px-6 py-8 text-white shadow-2xl shadow-emerald-500/10 glow-ring">
      <div className="absolute inset-0 shimmer bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.2),_transparent_60%)]" />
      <div className="relative flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.3em] text-white/70">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-1">
            <span className="h-2 w-2 rounded-full bg-emerald-300 pulse-dot" />
            Live Ranking
          </span>
          <span className="rounded-full border border-white/10 bg-white/5 px-4 py-1">
            Matchday Board
          </span>
        </div>
        <div>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            {clubName}
          </h1>
          <p className="mt-2 text-sm text-white/70">
            Recorded {formattedDate}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-emerald-100">
          <span className="rounded-full bg-emerald-500/15 px-3 py-1">
            {matchSummary}
          </span>
          <span className="text-white/70">
            Visual priority: Goals → Assists → Clean sheets
          </span>
        </div>
      </div>
    </header>
  );
}

