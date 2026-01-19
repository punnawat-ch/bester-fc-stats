"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useMemo } from "react";

import type { ScheduleMatch } from "../data/match-schedule";

type MatchScheduleTimelineProps = Readonly<{
  schedule: ScheduleMatch[];
}>;

type MonthGroup = {
  month: string;
  matches: ScheduleMatch[];
};

function groupByMonth(schedule: ScheduleMatch[]): MonthGroup[] {
  const map = new Map<string, ScheduleMatch[]>();
  schedule.forEach((match) => {
    const list = map.get(match.month) ?? [];
    list.push(match);
    map.set(match.month, list);
  });

  return Array.from(map.entries()).map(([month, matches]) => ({
    month,
    matches,
  }));
}

function parseEndDateTime(date: string, time: string) {
  const [day, month, year] = date.split("/").map(Number);
  if (!day || !month || !year) {
    return null;
  }

  const matches = [...time.matchAll(/(\d{1,2})[:.](\d{2})/g)];
  const lastMatch = matches.at(-1);
  if (!lastMatch) {
    return null;
  }

  const hours = Number(lastMatch[1]);
  const minutes = Number(lastMatch[2]);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return null;
  }

  const fullYear = year < 100 ? 2000 + year : year;
  return new Date(fullYear, month - 1, day, hours, minutes);
}

function isPastMatch(match: ScheduleMatch, now: Date) {
  if (!match.date || !match.time) {
    return false;
  }
  const endDate = parseEndDateTime(match.date, match.time);
  if (!endDate) {
    return false;
  }
  return now.getTime() > endDate.getTime();
}

function getSummary(schedule: ScheduleMatch[]) {
  const venues = new Set(schedule.map((match) => match.venue).filter(Boolean));
  const opponents = new Set(
    schedule.map((match) => match.opponent).filter(Boolean),
  );

  return {
    totalMatches: schedule.length,
    uniqueOpponents: opponents.size,
    venues: venues.size,
  };
}

export default function MatchScheduleTimeline({
  schedule,
}: MatchScheduleTimelineProps) {
  const filteredSchedule = useMemo(() => {
    const now = new Date();
    return schedule.filter((match) => !isPastMatch(match, now));
  }, [schedule]);

  const grouped = groupByMonth(filteredSchedule);
  const summary = getSummary(filteredSchedule);
  const reduceMotion = useReducedMotion();
  const container = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: reduceMotion ? 0 : 0.08,
      },
    },
  };
  const item = {
    hidden: { opacity: 0, y: reduceMotion ? 0 : 10 },
    show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
  };

  return (
    <motion.section
      id="schedule"
      className="glass-panel rounded-3xl border border-white/10 bg-[#0b1124]/85 px-6 py-6 shadow-2xl shadow-black/30 scroll-mt-24"
      variants={container}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.4 }}
    >
      <motion.div className="flex flex-wrap items-center justify-between gap-4" variants={item}>
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">
            Upcoming Fixtures
          </p>
          <h3 className="text-lg font-semibold text-white">
            Match Schedule Timeline
          </h3>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.2em] text-white/60">
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
            {summary.totalMatches} matches
          </span>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
            {summary.uniqueOpponents} opponents
          </span>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
            {summary.venues} venues
          </span>
        </div>
      </motion.div>

      <motion.div className="mt-6 space-y-6" variants={container}>
        {grouped.map((group) => (
          <motion.div key={group.month} className="space-y-3" variants={item}>
            <div className="flex items-center gap-3 text-sm font-semibold text-white">
              <span className="h-2 w-2 rounded-full bg-emerald-300" />
              {group.month}
            </div>
            <div className="space-y-3 border-l border-white/10 pl-4">
              {group.matches.map((match) => (
                <div
                  key={`${match.date}-${match.opponent}`}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-white/50">
                        {match.week} · {match.date}
                      </p>
                      <p className="mt-1 text-base font-semibold text-white">
                        vs {match.opponent}
                      </p>
                    </div>
                    <div className="text-right text-sm text-white/70">
                      <div>
                        {match.venue}
                        {match.field ? ` · ${match.field}` : ""}
                      </div>
                      <div className="text-xs">{match.time}</div>
                    </div>
                  </div>
                  {match.notes && (
                    <div className="mt-2 text-xs text-emerald-100/80">
                      {match.notes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </motion.div>
    </motion.section>
  );
}

