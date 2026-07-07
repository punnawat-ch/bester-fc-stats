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
    { label: "Wins", value: teamStats.wins, tone: "text-success" },
    { label: "Draws", value: teamStats.draws, tone: "text-warning" },
    { label: "Losses", value: teamStats.losses, tone: "text-danger" },
  ];
  const statsGoals = [
    { label: "GF", value: goalsFor },
    { label: "GA", value: goalsAgainst, tone: "text-warning" },
    { label: "GD", value: goalDifference, tone: "text-success" },
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
        className="relative overflow-hidden rounded-3xl border border-border bg-panel/80 p-5 text-fg shadow-panel-lg ring-1 ring-border"
        variants={item}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.06),transparent_60%)]" />
        <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.34em] text-fg-subtle">
              Performance Snapshot
            </p>
            <h3 className="text-lg font-semibold tracking-tight text-fg">
              Formline & Goal Lens
            </h3>
          </div>
          <span className="rounded-full border border-border bg-glass px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-fg-muted">
            Full Breakdown
          </span>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-[1.1fr_auto_0.9fr] lg:items-center">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {statsForm.map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-border bg-linear-to-br from-glass-2 via-glass to-transparent px-3 py-3 text-center shadow-elevate-lg"
              >
                <div className={`text-2xl font-semibold ${stat.tone ?? ""}`}>
                  {stat.value}
                </div>
                <div className="mt-1 text-[10px] uppercase tracking-[0.26em] text-fg-muted">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>

          <div className="hidden h-10 w-px bg-glass-3 lg:block" />

          <div className="grid grid-cols-3 gap-3">
            {statsGoals.map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-border bg-linear-to-br from-glass-2 via-glass to-transparent px-3 py-3 text-center shadow-elevate-lg"
              >
                <div className={`text-2xl font-semibold ${stat.tone ?? ""}`}>
                  {stat.value}
                </div>
                <div className="mt-1 text-[10px] uppercase tracking-[0.26em] text-fg-muted">
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

