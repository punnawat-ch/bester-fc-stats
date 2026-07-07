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
    <div className="glass-panel rounded-3xl border border-border bg-panel/80 px-5 py-5 shadow-panel-lg ring-1 ring-border">
      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.32em] text-fg-subtle">
            {shortName} · Roster
          </p>
          <h2 className="text-xl font-semibold text-fg">Squad</h2>
          <p className="text-xs text-fg-muted">
            Tap a card to flip it and see the player&apos;s stats
          </p>
        </div>
        <span className="rounded-full border border-border bg-glass px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-fg-muted">
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
