"use client";

import { FixtureCard } from "./fixture-card";
import { monthLabel, type MatchDTO } from "./lib";

type AgendaViewProps = Readonly<{
  matches: readonly MatchDTO[];
  onSelect: (match: MatchDTO) => void;
}>;

type WeekGroup = { key: string; label: string; matches: MatchDTO[] };
type MonthGroup = { key: string; label: string; weeks: WeekGroup[] };

function groupMatches(matches: readonly MatchDTO[]): MonthGroup[] {
  const months = new Map<
    string,
    { label: string; weeks: Map<string, MatchDTO[]> }
  >();

  for (const match of matches) {
    const monthKey = `${match.y}-${match.m}`;
    const monthEntry = months.get(monthKey) ?? {
      label: monthLabel(match.y, match.m),
      weeks: new Map<string, MatchDTO[]>(),
    };
    const weekKey = match.matchweek ?? "Other";
    const list = monthEntry.weeks.get(weekKey) ?? [];
    list.push(match);
    monthEntry.weeks.set(weekKey, list);
    months.set(monthKey, monthEntry);
  }

  return Array.from(months.entries()).map(([key, entry]) => ({
    key,
    label: entry.label,
    weeks: Array.from(entry.weeks.entries()).map(([weekKey, weekMatches]) => ({
      key: weekKey,
      label: weekKey,
      matches: weekMatches,
    })),
  }));
}

/**
 * AgendaView — mobile default: fixtures grouped by month → week, matching the
 * public `MatchScheduleTimeline` grouping (admin-ux-spec §4.5.1).
 */
export function AgendaView({ matches, onSelect }: AgendaViewProps) {
  const groups = groupMatches(matches);

  return (
    <div className="flex flex-col gap-6">
      {groups.map((month) => (
        <section key={month.key} className="flex flex-col gap-3">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-fg">
            <span
              className="size-2 rounded-full bg-primary"
              aria-hidden="true"
            />
            {month.label}
          </h2>
          {month.weeks.map((week) => (
            <div
              key={week.key}
              className="flex flex-col gap-2 border-l border-border pl-3"
            >
              <p className="text-[10px] uppercase tracking-[0.24em] text-fg-subtle">
                {week.label}
              </p>
              {week.matches.map((match) => (
                <FixtureCard
                  key={match.id}
                  match={match}
                  onSelect={onSelect}
                />
              ))}
            </div>
          ))}
        </section>
      ))}
    </div>
  );
}
