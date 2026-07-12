"use client";

import { Award } from "lucide-react";

import { cn } from "@/lib/utils";

import type { LineupRow } from "./lineup-editor";
import type { LineupStatKey } from "./schema";

function total(rows: readonly LineupRow[], key: LineupStatKey): number {
  return rows.reduce((sum, row) => sum + row.stats[key], 0);
}

/** "Somchai ×2" style scorer/carded labels. */
function contributors(
  rows: readonly LineupRow[],
  key: LineupStatKey,
): string[] {
  return rows
    .filter((row) => row.stats[key] > 0)
    .map((row) =>
      row.stats[key] > 1 ? `${row.name} ×${row.stats[key]}` : row.name,
    );
}

type Tone = "success" | "primary" | "warning" | "danger";

const TONE_TEXT: Readonly<Record<Tone, string>> = {
  success: "text-success",
  primary: "text-primary",
  warning: "text-warning",
  danger: "text-danger",
};

type SummaryTileProps = Readonly<{
  label: string;
  value: number;
  tone: Tone;
  hint?: string | null;
}>;

function SummaryTile({ label, value, tone, hint }: SummaryTileProps) {
  return (
    <div className="flex flex-col items-center gap-0.5 rounded-xl border border-border bg-bg/40 px-2 py-2.5">
      <span className={cn("font-mono text-2xl font-black tabular-nums", TONE_TEXT[tone])}>
        {value}
      </span>
      <span className="text-[10px] font-semibold uppercase tracking-wide text-fg-subtle">
        {label}
      </span>
      {hint ? (
        <span className="text-[10px] font-medium text-warning">{hint}</span>
      ) : null}
    </div>
  );
}

type NamesRowProps = Readonly<{ names: readonly string[] }>;

function NamesRow({ names }: NamesRowProps) {
  if (names.length === 0) {
    return null;
  }
  return (
    <div className="flex flex-wrap gap-1">
      {names.map((name) => (
        <span
          key={name}
          className="rounded-full bg-glass px-2 py-0.5 text-[11px] text-fg-muted"
        >
          {name}
        </span>
      ))}
    </div>
  );
}

function Divider() {
  return <div className="h-px bg-border" />;
}

type LineupSummaryProps = Readonly<{
  rows: readonly LineupRow[];
  /** Bester's scoreboard goals — lets you eyeball goals-vs-score at a glance. */
  teamGoals: number;
}>;

/**
 * Live-score style rollup of the lineup, grouped into MOM / G-A-CS / YC-RC so the
 * per-player numbers can be compared against the scoreboard at a glance. Updates
 * live as stats are edited in the lineup on the right.
 */
export function LineupSummary({ rows, teamGoals }: LineupSummaryProps) {
  const goals = total(rows, "goals");
  const assists = total(rows, "assists");
  const cleanSheets = total(rows, "cleanSheets");
  const yellow = total(rows, "yellowCards");
  const red = total(rows, "redCards");

  const mom = rows.filter((row) => row.stats.motm > 0).map((row) => row.name);
  const scorers = contributors(rows, "goals");
  const goalsHint = goals === teamGoals ? null : `score ${teamGoals}`;

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-glass p-4">
      <section className="flex flex-col gap-1.5">
        <div className="flex items-center gap-1.5">
          <Award className="size-3.5 text-podium-gold" aria-hidden="true" />
          <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-fg-subtle">
            Man of the Match
          </span>
        </div>
        {mom.length > 0 ? (
          <NamesRow names={mom} />
        ) : (
          <span className="text-sm text-fg-subtle">—</span>
        )}
      </section>

      <Divider />

      <section className="flex flex-col gap-2">
        <div className="grid grid-cols-3 gap-2">
          <SummaryTile label="Goals" value={goals} tone="success" hint={goalsHint} />
          <SummaryTile label="Assists" value={assists} tone="primary" />
          <SummaryTile label="Clean sheets" value={cleanSheets} tone="success" />
        </div>
        <NamesRow names={scorers} />
      </section>

      <Divider />

      <section className="grid grid-cols-2 gap-2">
        <SummaryTile label="Yellow" value={yellow} tone="warning" />
        <SummaryTile label="Red" value={red} tone="danger" />
      </section>
    </div>
  );
}
