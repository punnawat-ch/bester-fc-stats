"use client";

import { PlayerActions } from "./player-actions";
import type { PlayerDTO } from "./types";

type PlayerCardProps = Readonly<{
  player: PlayerDTO;
  canWrite: boolean;
  onEdit: (player: PlayerDTO) => void;
  onDelete: (player: PlayerDTO) => void;
}>;

type Stat = Readonly<{ short: string; label: string; value: number }>;

function buildStats(player: PlayerDTO): readonly Stat[] {
  return [
    { short: "G", label: "Goals", value: player.goals },
    { short: "A", label: "Assists", value: player.assists },
    { short: "MP", label: "Matches played", value: player.matchesPlayed },
    { short: "CS", label: "Clean sheets", value: player.cleanSheets },
  ];
}

/**
 * Mobile card for one player (admin-ux-spec §4.4 card list): name + mono stat
 * chips + overflow actions. Read-only for VIEWER (no `⋯` when `canWrite=false`).
 */
export function PlayerCard({
  player,
  canWrite,
  onEdit,
  onDelete,
}: PlayerCardProps) {
  const stats = buildStats(player);

  return (
    <div className="rounded-2xl border border-white/10 bg-linear-to-br from-white/8 via-white/4 to-transparent p-4 shadow-[0_12px_30px_rgba(0,0,0,0.35)] ring-1 ring-white/10">
      <div className="flex items-start justify-between gap-3">
        <p className="font-semibold text-white">{player.name}</p>
        {canWrite ? (
          <PlayerActions
            player={player}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ) : null}
      </div>
      <dl className="mt-2 flex flex-wrap gap-x-4 gap-y-1 font-mono text-sm text-white/70">
        {stats.map((stat) => (
          <div key={stat.short} className="flex items-center gap-1">
            <dt aria-label={stat.label}>{stat.short}</dt>
            <dd className="text-white">{stat.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
