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
      className="flex w-full items-center justify-between gap-3 rounded-2xl border border-white/10 bg-linear-to-br from-white/8 via-white/4 to-transparent p-4 text-left shadow-[0_12px_30px_rgba(0,0,0,0.35)] transition hover:border-white/25 focus-visible:ring-2 focus-visible:ring-sky-400/70 focus-visible:outline-none"
    >
      <div className="flex min-w-0 flex-col gap-1">
        <span className="flex items-center gap-2 font-mono text-xs text-white/60">
          <CalendarDays className="size-3.5 shrink-0" aria-hidden="true" />
          {longDateLabel(match.y, match.m, match.d)}
          {match.kickoff ? ` · ${match.kickoff}` : " · TBD"}
        </span>
        <span className="truncate text-sm font-semibold text-white">
          vs {match.opponent}
          {score ? (
            <span className="ml-2 font-mono text-white/70">{score}</span>
          ) : null}
        </span>
        {location ? (
          <span className="flex items-center gap-1.5 truncate text-xs text-white/50">
            <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
            {location}
          </span>
        ) : null}
      </div>
      <StatusChip {...matchStatusKind(match.status, match.result)} />
    </button>
  );
}
