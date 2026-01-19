"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";

import type { TeamStats } from "../lib/football";
type ClubHeaderProps = {
  clubName: string;
  recordedAt: string;
  teamStats: TeamStats;
};

export default function ClubHeader({
  clubName,
  recordedAt,
  teamStats,
}: ClubHeaderProps) {
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
    hidden: { opacity: 0, y: reduceMotion ? 0 : 12 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
  };

  const matchSummary = `${teamStats.matchesPlayed} MP · ${teamStats.wins} W · ${teamStats.draws} D · ${teamStats.losses} L`;
  const formattedDate = new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(recordedAt));

  return (
    <motion.header
      className="relative overflow-hidden rounded-3xl border border-sky-400/20 bg-linear-to-br from-[#0b1424] via-[#0c2430] to-[#0d2038] px-6 py-8 text-white shadow-2xl shadow-sky-500/10 glow-ring"
      variants={container}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.6 }}
    >
      <div className="absolute inset-0 shimmer bg-[radial-gradient(circle_at_top,rgba(14,165,233,0.25),transparent_60%)]" />
      <div className="relative flex flex-col gap-3">
        <motion.div
          className="flex-wrap items-center gap-3 text-xs uppercase tracking-[0.3em] text-white/70 hidden md:flex"
          variants={item}
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-1">
            <span className="h-2 w-2 rounded-full bg-sky-300 pulse-dot" />
            Live Ranking
          </span>
          <span className="rounded-full border border-white/10 bg-white/5 px-4 py-1">
            Matchday Board
          </span>
        </motion.div>
        <motion.div
          className="flex md:flex-row justify-center md:justify-start flex-col items-center gap-2"
          variants={item}
        >
          <Image
              src="/logo.png"
              alt="Bester FC crest"
              width={200}
              height={200}
              className="h-28 w-28 rounded-xl bg-white p-1"
              priority
            />
            <div className="flex flex-col gap-2">

        <div>
          <h1 className="text-3xl font-semibold text-center md:text-left tracking-tight sm:text-4xl">
            {clubName}
          </h1>
          <p className="mt-2 text-sm text-white/70 text-center md:text-left">
            Recorded {formattedDate}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-sky-100 justify-center md:justify-start">
          <span className="rounded-full bg-sky-500/15 px-3 py-1">
            {matchSummary}
          </span>
          <span className="text-white/70">
            Visual priority: Goals → Assists → Clean sheets
          </span>
        </div>
            </div>
        </motion.div>
        
      </div>
    </motion.header>
  );
}

