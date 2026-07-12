"use client";

import { Minus, Plus } from "lucide-react";

import { cn } from "@/lib/utils";

import type { MatchResult } from "@prisma/client";

const MAX_GOALS = 99;

type TeamSide = "home" | "away";

const RESULT_PILL: Readonly<
  Record<MatchResult, { label: string; className: string }>
> = {
  WIN: { label: "WIN", className: "bg-success/20 text-success" },
  DRAW: { label: "DRAW", className: "bg-warning/20 text-warning" },
  LOSS: { label: "LOSS", className: "bg-danger/20 text-danger" },
};

function clampGoals(value: number): number {
  if (Number.isNaN(value)) {
    return 0;
  }
  return Math.min(MAX_GOALS, Math.max(0, Math.trunc(value)));
}

type TeamScoreProps = Readonly<{
  name: string;
  side: TeamSide;
  value: string;
  leading: boolean;
  onChange: (value: string) => void;
}>;

function TeamScore({ name, side, value, leading, onChange }: TeamScoreProps) {
  const numeric = clampGoals(Number.parseInt(value, 10));
  const step = (next: number) => onChange(String(clampGoals(next)));
  const inputId = `score-${side}`;

  return (
    <div className="flex min-w-0 flex-1 flex-col items-center gap-2">
      <span
        className={cn(
          "max-w-full truncate text-xs font-semibold uppercase tracking-[0.14em]",
          leading ? "text-fg" : "text-fg-muted",
        )}
      >
        {name}
      </span>
      <label htmlFor={inputId} className="sr-only">
        {`${name} score`}
      </label>
      <input
        id={inputId}
        type="number"
        inputMode="numeric"
        min={0}
        max={MAX_GOALS}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onFocus={(event) => event.target.select()}
        className={cn(
          "w-full bg-transparent text-center font-mono text-6xl font-black tabular-nums outline-none",
          "[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
          leading ? "text-fg" : "text-fg-muted",
        )}
      />
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label={`Decrease ${name} score`}
          onClick={() => step(numeric - 1)}
          disabled={numeric <= 0}
          className="grid size-8 place-items-center rounded-full border border-border bg-glass text-fg outline-none transition hover:border-border-hover focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40"
        >
          <Minus className="size-4" />
        </button>
        <button
          type="button"
          aria-label={`Increase ${name} score`}
          onClick={() => step(numeric + 1)}
          className="grid size-8 place-items-center rounded-full border border-border bg-glass text-fg outline-none transition hover:border-border-hover focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Plus className="size-4" />
        </button>
      </div>
    </div>
  );
}

type ScoreBoardProps = Readonly<{
  opponent: string;
  goalsFor: string;
  goalsAgainst: string;
  result: MatchResult;
  onGoalsForChange: (value: string) => void;
  onGoalsAgainstChange: (value: string) => void;
}>;

/**
 * Live-score style scoreboard: two facing team scores with a centered result
 * pill. Purely presentational for the score/result; the win/draw/loss override
 * control lives below it in the finish-match form.
 */
export function ScoreBoard({
  opponent,
  goalsFor,
  goalsAgainst,
  result,
  onGoalsForChange,
  onGoalsAgainstChange,
}: ScoreBoardProps) {
  const forNum = clampGoals(Number.parseInt(goalsFor, 10));
  const againstNum = clampGoals(Number.parseInt(goalsAgainst, 10));
  const pill = RESULT_PILL[result];

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-b from-primary/10 to-bg/40 p-4 shadow-panel">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-16 left-1/2 size-40 -translate-x-1/2 rounded-full bg-primary/20 blur-3xl"
      />
      <div className="relative flex flex-col gap-3">
        <div className="flex items-center justify-center gap-1.5">
          <span className="size-1.5 animate-pulse rounded-full bg-success" />
          <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-fg-subtle">
            Full Time
          </span>
        </div>

        <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-2">
          <TeamScore
            name="Bester"
            side="home"
            value={goalsFor}
            leading={forNum > againstNum}
            onChange={onGoalsForChange}
          />
          <div className="flex flex-col items-center gap-2 pt-7">
            <span className="text-2xl font-black text-fg-subtle">–</span>
            <span
              className={cn(
                "rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider",
                pill.className,
              )}
            >
              {pill.label}
            </span>
          </div>
          <TeamScore
            name={opponent}
            side="away"
            value={goalsAgainst}
            leading={againstNum > forNum}
            onChange={onGoalsAgainstChange}
          />
        </div>
      </div>
    </div>
  );
}
