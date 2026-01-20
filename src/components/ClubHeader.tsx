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
      className="relative overflow-hidden rounded-3xl px-6 py-6 text-white "
      variants={container}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.6 }}
    >
      <div className="pointer-events-none absolute inset-0 " />
      <div className="relative flex flex-col gap-4">
        <motion.div
          className="hidden flex-wrap items-center gap-3 text-[10px] uppercase tracking-[0.34em] text-white/60 md:flex"
          variants={item}
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1">
            <span className="h-2 w-2 rounded-full bg-sky-300" />
            Live Ranking
          </span>
          <span className="rounded-full border border-white/10 bg-white/5 px-4 py-1">
            Matchday Board
          </span>
        </motion.div>
        <motion.div
          className="flex flex-col items-center gap-4 md:flex-row md:items-center md:justify-start"
          variants={item}
        >
          <Image
              src="/logo.png"
              alt="Bester FC crest"
              width={200}
              height={200}
              className="h-28 w-28 rounded-2xl border border-white/60 bg-white/5 p-1 shadow-[0_26px_32px_rgba(0,0,0,0.35)]"
              priority
            />
            <div className="flex flex-col gap-2">

        <div>
          <h1 className="text-2xl font-semibold text-center tracking-tight text-white sm:text-3xl md:text-left">
            {clubName}
          </h1>
          <p className="mt-1 text-xs text-white/60 text-center md:text-left">
            Recorded on {formattedDate}
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3 text-xs font-medium text-white/80 md:justify-start">
          <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1">
            {matchSummary}
          </span>
          <span className="hidden text-white/60 md:block">
            Visual priority: Goals → Assists → Clean sheets
          </span>
        </div>
            </div>
        </motion.div>
        
      </div>
    </motion.header>
  );
}

