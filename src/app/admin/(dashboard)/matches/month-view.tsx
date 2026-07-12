"use client";

import { Calendar } from "@/components/ui/calendar";

import { dateKey, type MatchDTO } from "./lib";

type MonthViewProps = Readonly<{
  matches: readonly MatchDTO[];
  /** The month/year currently shown (controlled by the in-caption dropdowns). */
  month: Date;
  onMonthChange: (date: Date) => void;
  onDayClick: (date: Date) => void;
  /** Sorted selectable years — bounds the year dropdown in the caption. */
  years: readonly number[];
}>;

type DayBuckets = {
  scheduled: Date[];
  win: Date[];
  draw: Date[];
  loss: Date[];
};

function classifyDay(list: readonly MatchDTO[]): keyof DayBuckets {
  if (list.some((match) => match.status === "SCHEDULED")) {
    return "scheduled";
  }
  if (list.some((match) => match.result === "WIN")) {
    return "win";
  }
  if (list.some((match) => match.result === "DRAW")) {
    return "draw";
  }
  return "loss";
}

function buildBuckets(matches: readonly MatchDTO[]): DayBuckets {
  const byDay = new Map<string, MatchDTO[]>();
  for (const match of matches) {
    const key = dateKey(match.y, match.m, match.d);
    const list = byDay.get(key) ?? [];
    list.push(match);
    byDay.set(key, list);
  }

  const buckets: DayBuckets = { scheduled: [], win: [], draw: [], loss: [] };
  for (const list of byDay.values()) {
    const sample = list[0];
    const date = new Date(sample.y, sample.m, sample.d);
    buckets[classifyDay(list)].push(date);
  }
  return buckets;
}

const DOT_BASE =
  "after:absolute after:bottom-1 after:left-1/2 after:size-1.5 after:-translate-x-1/2 after:rounded-full after:content-['']";

const MODIFIER_CLASS_NAMES: Readonly<Record<keyof DayBuckets, string>> = {
  scheduled: `${DOT_BASE} after:bg-primary`,
  win: `${DOT_BASE} after:bg-success`,
  draw: `${DOT_BASE} after:bg-fg-muted`,
  loss: `${DOT_BASE} after:bg-danger`,
};

/**
 * MonthView — react-day-picker month grid with a coloured dot on days that have
 * a fixture: sky=SCHEDULED, emerald=WIN, blue=DRAW, rose=LOSS (admin-ux-spec
 * §3.3 / §4.5.1). The shown month is controlled by the parent's month/year
 * picker; tapping a day is handled by the parent.
 */
export function MonthView({
  matches,
  month,
  onMonthChange,
  onDayClick,
  years,
}: MonthViewProps) {
  const buckets = buildBuckets(matches);
  const firstYear = years[0] ?? month.getFullYear();
  const lastYear = years[years.length - 1] ?? month.getFullYear();

  return (
    <div
      className="rounded-3xl border border-border bg-panel/80 p-3 ring-1 ring-border"
      data-tour="matches-month-grid"
    >
      <Calendar
        mode="single"
        month={month}
        onMonthChange={onMonthChange}
        captionLayout="dropdown"
        startMonth={new Date(firstYear, 0, 1)}
        endMonth={new Date(lastYear, 11, 1)}
        onDayClick={(date) => onDayClick(date)}
        showOutsideDays
        modifiers={buckets}
        modifiersClassNames={MODIFIER_CLASS_NAMES}
        className="w-full [--cell-size:2.6rem]"
        classNames={{ month: "flex w-full flex-col gap-4" }}
      />
    </div>
  );
}
