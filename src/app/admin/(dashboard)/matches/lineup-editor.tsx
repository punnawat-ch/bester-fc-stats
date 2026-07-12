"use client";

import { useState } from "react";
import { Minus, Plus, UserPlus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

import type { RosterPlayer } from "./lib";
import { LINEUP_STAT_KEYS, type LineupStatKey } from "./schema";

/** A single editable lineup row held in the finish-match form state. */
export type LineupRow = {
  key: string;
  /** Existing player id, or `null` for a brand-new player named in `name`. */
  playerId: string | null;
  name: string;
  /** Jersey number (existing players only) — shown to disambiguate same names. */
  jerseyNumber: number | null;
  stats: Record<LineupStatKey, number>;
};

const STAT_LABELS: Readonly<Record<LineupStatKey, string>> = {
  goals: "G",
  assists: "A",
  cleanSheets: "CS",
  yellowCards: "YC",
  redCards: "RC",
  motm: "MOTM",
  saves: "SV",
};

const MAX_STAT = 99;

export function emptyStats(): Record<LineupStatKey, number> {
  const stats = {} as Record<LineupStatKey, number>;
  for (const key of LINEUP_STAT_KEYS) {
    stats[key] = 0;
  }
  return stats;
}

let rowSeq = 0;
function nextKey(): string {
  rowSeq += 1;
  return `row-${rowSeq}`;
}

type StatStepperProps = Readonly<{
  label: string;
  value: number;
  onChange: (value: number) => void;
}>;

function StatStepper({ label, value, onChange }: StatStepperProps) {
  const set = (next: number) => onChange(Math.min(MAX_STAT, Math.max(0, next)));
  return (
    <div className="flex min-w-0 flex-col gap-1.5 rounded-lg border border-border bg-bg/40 p-2">
      <span className="text-center text-[10px] font-semibold uppercase tracking-wide text-fg-subtle">
        {label}
      </span>
      <div className="flex items-center justify-between gap-1">
        <button
          type="button"
          aria-label={`Decrease ${label}`}
          onClick={() => set(value - 1)}
          disabled={value <= 0}
          className="grid size-8 shrink-0 place-items-center rounded-md border border-border bg-glass text-fg outline-none transition hover:border-border-hover focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40"
        >
          <Minus className="size-3.5" />
        </button>
        <span className="min-w-6 flex-1 text-center font-mono text-base font-bold tabular-nums text-fg">
          {value}
        </span>
        <button
          type="button"
          aria-label={`Increase ${label}`}
          onClick={() => set(value + 1)}
          className="grid size-8 shrink-0 place-items-center rounded-md border border-border bg-glass text-fg outline-none transition hover:border-border-hover focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Plus className="size-3.5" />
        </button>
      </div>
    </div>
  );
}

type LineupRowCardProps = Readonly<{
  row: LineupRow;
  onStat: (key: LineupStatKey, value: number) => void;
  onRemove: () => void;
}>;

function LineupRowCard({ row, onStat, onRemove }: LineupRowCardProps) {
  return (
    <div className="@container flex flex-col gap-3 rounded-xl border border-border bg-glass p-3">
      <div className="flex items-center gap-2.5">
        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary/15 font-mono text-xs font-bold text-primary">
          {row.jerseyNumber ?? row.name.charAt(0).toUpperCase()}
        </span>
        <span className="flex-1 truncate text-sm font-medium text-fg">
          {row.name}
          {row.playerId === null ? (
            <span className="ml-1.5 rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
              new
            </span>
          ) : null}
        </span>
        <button
          type="button"
          aria-label={`Remove ${row.name}`}
          onClick={onRemove}
          className="grid size-7 shrink-0 place-items-center rounded-md text-fg-subtle outline-none transition hover:text-danger focus-visible:ring-2 focus-visible:ring-ring"
        >
          <X className="size-4" />
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2 @[22rem]:grid-cols-3 @[30rem]:grid-cols-4 @[44rem]:grid-cols-7">
        {LINEUP_STAT_KEYS.map((key) => (
          <StatStepper
            key={key}
            label={STAT_LABELS[key]}
            value={row.stats[key]}
            onChange={(value) => onStat(key, value)}
          />
        ))}
      </div>
    </div>
  );
}

type LineupEditorProps = Readonly<{
  roster: readonly RosterPlayer[];
  rows: readonly LineupRow[];
  onChange: (rows: LineupRow[]) => void;
}>;

/**
 * Lineup editor for the finish-match flow: add players from the existing squad
 * (upsert) or create a brand-new player inline, then enter each player's stats
 * for this match. Fully optional — an empty lineup is valid.
 */
export function LineupEditor({ roster, rows, onChange }: LineupEditorProps) {
  const [newName, setNewName] = useState("");
  const addedIds = new Set(
    rows.map((row) => row.playerId).filter((id): id is string => id !== null),
  );
  const available = roster.filter((player) => !addedIds.has(player.id));

  const addExisting = (player: RosterPlayer) => {
    onChange([
      ...rows,
      {
        key: nextKey(),
        playerId: player.id,
        name: player.name,
        jerseyNumber: player.jerseyNumber,
        stats: emptyStats(),
      },
    ]);
  };

  const addNew = () => {
    const name = newName.trim();
    if (name === "") {
      return;
    }
    onChange([
      ...rows,
      {
        key: nextKey(),
        playerId: null,
        name,
        jerseyNumber: null,
        stats: emptyStats(),
      },
    ]);
    setNewName("");
  };

  const updateStat = (key: string, stat: LineupStatKey, value: number) => {
    onChange(
      rows.map((row) =>
        row.key === key
          ? { ...row, stats: { ...row.stats, [stat]: value } }
          : row,
      ),
    );
  };

  const removeRow = (key: string) => {
    onChange(rows.filter((row) => row.key !== key));
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-fg-muted">
          Lineup <span className="text-fg-subtle">(optional)</span>
        </span>
        <span className="text-xs text-fg-subtle">{rows.length} selected</span>
      </div>

      {available.length > 0 ? (
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Add from squad">
          {available.map((player) => (
            <button
              key={player.id}
              type="button"
              onClick={() => addExisting(player)}
              className={cn(
                "rounded-full border border-border bg-glass px-2.5 py-1 text-xs font-medium text-fg-muted",
                "outline-none transition hover:border-primary/40 hover:text-fg focus-visible:ring-2 focus-visible:ring-ring",
              )}
            >
              <Plus className="mr-1 inline size-3" aria-hidden="true" />
              {player.jerseyNumber === null ? null : (
                <span className="mr-1 font-mono text-primary">
                  #{player.jerseyNumber}
                </span>
              )}
              {player.name}
            </button>
          ))}
        </div>
      ) : null}

      <div className="flex items-center gap-2">
        <Input
          value={newName}
          onChange={(event) => setNewName(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              addNew();
            }
          }}
          placeholder="New player name"
          autoComplete="off"
          maxLength={80}
          className="h-9"
        />
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={addNew}
          disabled={newName.trim() === ""}
        >
          <UserPlus aria-hidden="true" />
          Add
        </Button>
      </div>

      {rows.length > 0 ? (
        <div className="flex flex-col gap-2">
          {rows.map((row) => (
            <LineupRowCard
              key={row.key}
              row={row}
              onStat={(stat, value) => updateStat(row.key, stat, value)}
              onRemove={() => removeRow(row.key)}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

/** Seed editor rows from a match's stored lineup (for editing a played match). */
export function rowsFromLineup(
  lineup: ReadonlyArray<{
    playerId: string;
    name: string;
  } & Record<LineupStatKey, number>>,
  roster: readonly RosterPlayer[],
): LineupRow[] {
  const jerseyById = new Map(
    roster.map((player) => [player.id, player.jerseyNumber]),
  );
  return lineup.map((entry) => {
    const stats = emptyStats();
    for (const key of LINEUP_STAT_KEYS) {
      stats[key] = entry[key];
    }
    return {
      key: nextKey(),
      playerId: entry.playerId,
      name: entry.name,
      jerseyNumber: jerseyById.get(entry.playerId) ?? null,
      stats,
    };
  });
}

/** Map editor rows to the server payload shape (existing vs new player). */
export function rowsToPayload(rows: readonly LineupRow[]) {
  return rows.map((row) => ({
    ...(row.playerId ? { playerId: row.playerId } : { newPlayerName: row.name }),
    ...row.stats,
  }));
}
