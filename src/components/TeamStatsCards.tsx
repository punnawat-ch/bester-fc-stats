"use client";

import { motion, useReducedMotion } from "framer-motion";

import type { TeamStats } from "../lib/football";
import StatBadge from "./StatBadge";

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

  return (
    <motion.section
      className="grid w-full gap-4 grid-cols-1"
      variants={container}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.4 }}
    >
    {/* <section className="grid w-full gap-4 lg:grid-cols-[1.1fr_0.9fr]"> */}
      <motion.div
        id="form"
        className="glass-panel rounded-3xl border border-white/10 bg-[#0b1124]/85 p-4 shadow-2xl shadow-black/20 scroll-mt-24"
        variants={item}
      >
        <motion.div className="flex items-center justify-between" variants={item}>
          <div>
            <h3 className="text-lg font-semibold text-white">
              Competition Form
            </h3>
          </div>
          {/* <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.2em] text-white/70">
            League
          </span> */}
        </motion.div>
        <motion.div
          className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-7"
          variants={item}
        >
          <StatBadge label="MATCHES" value={teamStats.matchesPlayed} size="sm" />
          <StatBadge label="WINS" value={teamStats.wins} tone="success" size="sm" />
          <StatBadge label="DRAWS" value={teamStats.draws} tone="warning" size="sm" />
          <StatBadge label="LOSSES" value={teamStats.losses} tone="danger" size="sm" />
          <StatBadge label="GF" value={goalsFor} size="sm" />
          <StatBadge label="GA" value={goalsAgainst} tone="warning" size="sm" />
          <StatBadge label="GD" value={goalDifference} tone="success" size="sm" />
        </motion.div>
      </motion.div>
{/* 
      <div
        id="goals"
        className="glass-panel rounded-3xl border border-white/10 bg-[#0b1124]/85 p-4 shadow-2xl shadow-black/20 scroll-mt-24"
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">
              Goal Breakdown
            </h3>
          </div>
          <span className="rounded-full border border-white/10 bg-blue-500/15 px-3 py-1 text-xs uppercase tracking-[0.2em] text-blue-100">
            Goals
          </span>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-3">
          <StatBadge label="GF" value={goalsFor} size="sm" />
          <StatBadge label="GA" value={goalsAgainst} tone="warning" size="sm" />
          <StatBadge label="GD" value={goalDifference} tone="success" size="sm" />
        </div>
      </div> */}
    </motion.section>
  );
}

