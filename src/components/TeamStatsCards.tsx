"use client";

import { motion, useReducedMotion } from "framer-motion";

import type { TeamStats } from "../lib/football";

type TeamStatsCardsProps = Readonly<{
  teamStats: TeamStats;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
}>;

export default function TeamStatsCards({
  teamStats,
  goalsFor,
  goalsAgainst,
  goalDifference,
}: TeamStatsCardsProps) {
  const reduceMotion = useReducedMotion();
  const container = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: reduceMotion ? 0 : 0.06,
      },
    },
  };
  const item = {
    hidden: { opacity: 0, y: reduceMotion ? 0 : 10 },
    show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
  };

  const statsForm = [
    { label: "Matches", value: teamStats.matchesPlayed },
    { label: "Wins", value: teamStats.wins, tone: "text-emerald-600" },
    { label: "Draws", value: teamStats.draws, tone: "text-amber-600" },
    { label: "Losses", value: teamStats.losses, tone: "text-rose-600" },
  ];
  const statsGoals = [
    { label: "GF", value: goalsFor },
    { label: "GA", value: goalsAgainst, tone: "text-amber-600" },
    { label: "GD", value: goalDifference, tone: "text-emerald-600" },
  ];

  return (
    <motion.section
      id="form"
      className="w-full scroll-mt-24"
      variants={container}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.4 }}
    >
      <motion.div
        className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[#0b1124]/85 p-6 text-white shadow-[0_30px_90px_rgba(0,0,0,0.5)]"
        variants={item}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_55%)]" />
        <div className="pointer-events-none absolute -right-16 top-6 h-32 w-32 rounded-full bg-emerald-400/10 blur-2xl" />
        <div className="pointer-events-none absolute -left-12 bottom-6 h-24 w-24 rounded-full bg-sky-400/10 blur-2xl" />
        <div className="relative flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-white/60">
              Performance Snapshot
            </p>
            <h3 className="text-xl font-semibold tracking-tight">
              Formline & Goal Lens
            </h3>
          </div>
          <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-white/70">
            Full Season
          </span>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_auto_0.9fr] lg:items-center">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {statsForm.map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-white/15 bg-linear-to-br from-white/10 via-white/5 to-transparent px-4 py-4 shadow-[0_18px_40px_rgba(0,0,0,0.45)] ring-1 ring-white/10"
              >
                <div className={`text-3xl font-semibold ${stat.tone ?? ""}`}>
                  {stat.value}
                </div>
                <div className="mt-1 text-xs uppercase tracking-[0.25em] text-white/60">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>

          <div className="hidden h-14 w-px bg-white/10 lg:block" />

          <div className="grid grid-cols-3 gap-4">
            {statsGoals.map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-white/15 bg-linear-to-br from-white/10 via-white/5 to-transparent px-4 py-4 text-center shadow-[0_18px_40px_rgba(0,0,0,0.45)] ring-1 ring-white/10"
              >
                <div className={`text-3xl font-semibold ${stat.tone ?? ""}`}>
                  {stat.value}
                </div>
                <div className="mt-1 text-xs uppercase tracking-[0.25em] text-white/60">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.section>
  );
}

