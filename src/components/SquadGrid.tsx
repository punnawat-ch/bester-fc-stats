import type { SquadPlayer } from "../lib/types";
import PlayerFlipCard from "./PlayerFlipCard";

type SquadGridProps = Readonly<{
  players: readonly SquadPlayer[];
  shortName?: string;
}>;

// Server component: renders the responsive Squad grid of flip cards.
export default function SquadGrid({
  players,
  shortName = "Squad",
}: SquadGridProps) {
  if (players.length === 0) {
    return null;
  }

  return (
    <div className="glass-panel rounded-3xl border border-white/10 bg-[#0a1222]/80 px-5 py-5 shadow-[0_22px_60px_rgba(0,0,0,0.45)] ring-1 ring-white/10">
      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.32em] text-white/50">
            {shortName} · Roster
          </p>
          <h2 className="text-xl font-semibold text-white">Squad</h2>
          <p className="text-xs text-white/60">
            Tap a card to flip it and see the player&apos;s stats
          </p>
        </div>
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-white/70">
          {players.length} players
        </span>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
        {players.map((player) => (
          <PlayerFlipCard key={player.id} player={player} />
        ))}
      </div>
    </div>
  );
}
