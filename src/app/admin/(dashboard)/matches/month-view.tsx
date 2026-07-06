"use client";

import { Calendar } from "@/components/ui/calendar";

import { dateKey, type MatchDTO } from "./lib";

type MonthViewProps = Readonly<{
  matches: readonly MatchDTO[];
  onDayClick: (date: Date) => void;
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
  scheduled: `${DOT_BASE} after:bg-sky-300`,
  win: `${DOT_BASE} after:bg-emerald-300`,
  draw: `${DOT_BASE} after:bg-blue-300`,
  loss: `${DOT_BASE} after:bg-rose-300`,
};

const initialMonth = new Date();

/**
 * MonthView — react-day-picker month grid with a coloured dot on days that have
 * a fixture: sky=SCHEDULED, emerald=WIN, blue=DRAW, rose=LOSS (admin-ux-spec
 * §3.3 / §4.5.1). Tapping a day is handled by the parent.
 */
export function MonthView({ matches, onDayClick }: MonthViewProps) {
  const buckets = buildBuckets(matches);

  return (
    <div className="rounded-3xl border border-white/10 bg-[#0a1222]/80 p-3 ring-1 ring-white/10">
      <Calendar
        mode="single"
        defaultMonth={initialMonth}
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
