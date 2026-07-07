"use client";

import { PlayerActions } from "./player-actions";
import type { PlayerDTO } from "./types";

type PlayerTableHeadProps = Readonly<{ canWrite: boolean }>;

/** `<th>` cells for the md+ table header (wrapped in a `<tr>` by ResponsiveList). */
export function PlayerTableHead({ canWrite }: PlayerTableHeadProps) {
  return (
    <>
      <th>Name</th>
      <th className="text-right">MP</th>
      <th className="text-right">Goals</th>
      <th className="text-right">Assists</th>
      <th className="text-right">CS</th>
      {canWrite ? (
        <th className="text-right">
          <span className="sr-only">Actions</span>
        </th>
      ) : null}
    </>
  );
}

type PlayerRowCellsProps = Readonly<{
  player: PlayerDTO;
  canWrite: boolean;
  onEdit: (player: PlayerDTO) => void;
  onDelete: (player: PlayerDTO) => void;
}>;

/** `<td>` cells for one player row (wrapped in a `<tr>` by ResponsiveList). */
export function PlayerRowCells({
  player,
  canWrite,
  onEdit,
  onDelete,
}: PlayerRowCellsProps) {
  return (
    <>
      <td className="font-medium text-fg">{player.name}</td>
      <td className="text-right font-mono text-fg-muted">
        {player.matchesPlayed}
      </td>
      <td className="text-right font-mono text-fg-muted">{player.goals}</td>
      <td className="text-right font-mono text-fg-muted">{player.assists}</td>
      <td className="text-right font-mono text-fg-muted">
        {player.cleanSheets}
      </td>
      {canWrite ? (
        <td className="text-right">
          <div className="flex justify-end">
            <PlayerActions
              player={player}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          </div>
        </td>
      ) : null}
    </>
  );
}
