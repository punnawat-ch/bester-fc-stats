import { CalendarDays, MapPin } from "lucide-react";

import type { ScheduleMatch } from "@/lib/types";
import { StatusChip } from "@/components/admin/StatusChip";

type UpcomingFixtureCardProps = Readonly<{
  fixture: ScheduleMatch;
}>;

function buildLocation(venue: string, field?: string): string {
  return [venue, field].filter(Boolean).join(" · ");
}

/** Compact SCHEDULED fixture row for the dashboard's upcoming list. */
export function UpcomingFixtureCard({ fixture }: UpcomingFixtureCardProps) {
  const location = buildLocation(fixture.venue, fixture.field);

  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-linear-to-br from-glass-2 via-glass to-transparent p-4 shadow-elevate-lg">
      <div className="flex flex-col gap-1">
        <span className="text-sm font-semibold text-fg">
          vs {fixture.opponent}
        </span>
        <span className="flex items-center gap-1.5 font-mono text-xs text-fg-muted">
          <CalendarDays className="size-3.5" aria-hidden="true" />
          {fixture.date}
          {fixture.time ? ` · ${fixture.time}` : " · TBD"}
        </span>
        {location ? (
          <span className="flex items-center gap-1.5 text-xs text-fg-subtle">
            <MapPin className="size-3.5" aria-hidden="true" />
            {location}
          </span>
        ) : null}
      </div>
      <StatusChip status="SCHEDULED" />
    </div>
  );
}
