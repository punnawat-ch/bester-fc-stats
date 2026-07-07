"use client";

import { CalendarDays, MapPin } from "lucide-react";

import { StatusChip, matchStatusKind } from "@/components/admin/StatusChip";

import { longDateLabel, type MatchDTO } from "./lib";

type FixtureCardProps = Readonly<{
  match: MatchDTO;
  onSelect: (match: MatchDTO) => void;
}>;

function locationLabel(venue: string | null, field: string | null): string {
  return [venue, field].filter(Boolean).join(" · ");
}

function scoreLabel(match: MatchDTO): string | null {
  if (match.status !== "PLAYED" || match.goalsFor === null) {
    return null;
  }
  return `${match.goalsFor}–${match.goalsAgainst}`;
}

/** Agenda / day-list fixture row. Taps open the detail sheet. */
export function FixtureCard({ match, onSelect }: FixtureCardProps) {
  const location = locationLabel(match.venue, match.field);
  const score = scoreLabel(match);

  return (
    <button
      type="button"
      data-tour="match-item"
      onClick={() => onSelect(match)}
      className="flex w-full items-center justify-between gap-3 rounded-2xl border border-border bg-linear-to-br from-glass-2 via-glass to-transparent p-4 text-left shadow-elevate-lg transition hover:border-border-hover focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    >
      <div className="flex min-w-0 flex-col gap-1">
        <span className="flex items-center gap-2 font-mono text-xs text-fg-muted">
          <CalendarDays className="size-3.5 shrink-0" aria-hidden="true" />
          {longDateLabel(match.y, match.m, match.d)}
          {match.kickoff ? ` · ${match.kickoff}` : " · TBD"}
        </span>
        <span className="truncate text-sm font-semibold text-fg">
          vs {match.opponent}
          {score ? (
            <span className="ml-2 font-mono text-fg-muted">{score}</span>
          ) : null}
        </span>
        {location ? (
          <span className="flex items-center gap-1.5 truncate text-xs text-fg-subtle">
            <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
            {location}
          </span>
        ) : null}
      </div>
      <StatusChip {...matchStatusKind(match.status, match.result)} />
    </button>
  );
}
