"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";

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

function parseStartDateTime(date: string, time: string) {
  const [day, month, year] = date.split("/").map(Number);
  if (!day || !month || !year) {
    return null;
  }

  const matches = [...time.matchAll(/(\d{1,2})[:.](\d{2})/g)];
  const firstMatch = matches[0];
  if (!firstMatch) {
    return null;
  }

  const hours = Number(firstMatch[1]);
  const minutes = Number(firstMatch[2]);
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

function getCountdown(target: Date, now: Date) {
  const totalSeconds = Math.max(
    0,
    Math.floor((target.getTime() - now.getTime()) / 1000),
  );
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return {
    days,
    hours,
    minutes,
    seconds,
    isStarted: totalSeconds <= 0,
  };
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
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  const filteredSchedule = useMemo(() => {
    return schedule.filter((match) => !isPastMatch(match, now));
  }, [schedule, now]);

  const grouped = groupByMonth(filteredSchedule);
  const summary = getSummary(filteredSchedule);
  const nextMatch = useMemo(() => {
    const upcoming = filteredSchedule
      .map((match) => ({
        match,
        startDate:
          match.date && match.time
            ? parseStartDateTime(match.date, match.time)
            : null,
      }))
      .filter(
        (item) => item.startDate && item.startDate.getTime() >= now.getTime(),
      )
      .sort((a, b) => a.startDate!.getTime() - b.startDate!.getTime());
    return upcoming[0] ?? null;
  }, [filteredSchedule, now]);
  const nextMatchKey = nextMatch
    ? `${nextMatch.match.date}-${nextMatch.match.opponent}-${nextMatch.match.time}`
    : null;
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
      className="glass-panel rounded-3xl border border-white/10 bg-[#0a1222]/80 px-5 py-5 shadow-[0_22px_60px_rgba(0,0,0,0.45)] ring-1 ring-white/10 scroll-mt-24"
      variants={container}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.4 }}
    >
      <motion.div
        className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between"
        variants={item}
      >
        <div>
          <p className="text-[10px] uppercase tracking-[0.32em] text-white/50">
            Upcoming Fixtures
          </p>
          <h3 className="text-lg font-semibold text-white">
            Match Schedule Timeline
          </h3>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-[0.24em] text-white/60">
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
              <span className="h-2 w-2 rounded-full bg-sky-300" />
              {group.month}
            </div>
            <div className="space-y-3 border-l border-white/10 pl-4 sm:pl-5">
              {group.matches.map((match) => {
                const matchKey = `${match.date}-${match.opponent}-${match.time}`;
                const isNext = nextMatchKey === matchKey;
                const countdown =
                  isNext && nextMatch?.startDate
                    ? getCountdown(nextMatch.startDate, now)
                    : null;

                return (
                  <div
                    key={matchKey}
                    className={`rounded-2xl border px-4 py-3 shadow-[0_16px_35px_rgba(0,0,0,0.4)] ring-1 ${
                      isNext
                        ? "border-emerald-400/40 bg-linear-to-br from-emerald-500/12 via-white/8 to-transparent ring-emerald-400/30"
                        : "border-white/10 bg-linear-to-br from-white/8 via-white/4 to-transparent ring-white/10"
                    }`}
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.24em] text-white/50">
                          {match.week} · {match.date}
                        </p>
                        <p className="mt-1 text-base font-semibold text-white">
                          vs {match.opponent}
                        </p>
                      </div>
                      <div className="text-left text-sm text-white/70 sm:text-right">
                        <div>
                          {match.venue}
                          {match.field ? ` · ${match.field}` : ""}
                        </div>
                        <div className="text-xs">{match.time}</div>
                        {isNext && (
                          <span className="mt-2 inline-flex rounded-full border border-emerald-400/40 bg-emerald-500/15 px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] text-emerald-100">
                            Next Match
                          </span>
                        )}
                      </div>
                    </div>
                    {countdown && !countdown.isStarted && (
                      <div className="mt-3 grid grid-cols-4 gap-2 text-center text-[10px] uppercase tracking-[0.2em] text-white/70">
                        {[
                          { label: "Days", value: countdown.days },
                          { label: "Hours", value: countdown.hours },
                          { label: "Min", value: countdown.minutes },
                          { label: "Sec", value: countdown.seconds },
                        ].map((item) => (
                          <div
                            key={item.label}
                            className="rounded-xl border border-white/10 bg-white/5 px-2 py-2"
                          >
                            <div className="text-base font-semibold text-white">
                              {String(item.value).padStart(2, "0")}
                            </div>
                            <div className="text-[10px] text-white/50">
                              {item.label}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {match.notes && (
                      <div className="mt-2 text-xs text-emerald-100/80">
                        {match.notes}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        ))}
      </motion.div>
    </motion.section>
  );
}

