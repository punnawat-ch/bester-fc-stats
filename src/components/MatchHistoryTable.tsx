"use client";

import { motion, useReducedMotion } from "framer-motion";

import type { MatchHistory } from "../data/football-stats";

type MatchHistoryTableProps = Readonly<{
  matchHistory: MatchHistory[];
  clubName: string;
}>;

const resultStyles: Record<string, string> = {
  win: "border-emerald-400/60 bg-emerald-500/10 text-emerald-100",
  loss: "border-rose-400/60 bg-rose-500/10 text-rose-100",
  draw: "border-slate-400/60 bg-slate-500/10 text-slate-100",
};

function getResultTone(result: string) {
  const key = result.trim().toLowerCase();
  return resultStyles[key] ?? "border-white/10 bg-white/5 text-white/70";
}

function getTeamTone(result: string) {
  const key = result.trim().toLowerCase();
  if (key === "win") {
    return { club: "text-white font-semibold", opponent: "text-white/60" };
  }
  if (key === "loss") {
    return { club: "text-white/50", opponent: "text-white font-semibold" };
  }
  return { club: "text-white/80", opponent: "text-white/80" };
}

function getScoreLines(result: string, score: string) {
  const parts = score.split("-").map((part) => part.trim());
  if (parts.length !== 2 || parts.some((part) => part.length === 0)) {
    return { clubScore: score, opponentScore: "" };
  }

  const [first, second] = parts;
  const key = result.trim().toLowerCase();
  if (key === "loss") {
    return { clubScore: second, opponentScore: first };
  }
  return { clubScore: first, opponentScore: second };
}

export default function MatchHistoryTable({
  matchHistory,
  clubName,
}: MatchHistoryTableProps) {
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
      className="glass-panel rounded-3xl border border-white/10 bg-[#0a1222]/80 px-5 py-5 shadow-[0_22px_60px_rgba(0,0,0,0.45)] ring-1 ring-white/10"
      variants={container}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.4 }}
    >
      <motion.div className="flex items-center justify-between" variants={item}>
        <div>
          <p className="text-[10px] uppercase tracking-[0.32em] text-white/50">
            Results
          </p>
          <h3 className="text-lg font-semibold text-white">Match History</h3>
        </div>
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-white/70">
          Results
        </span>
      </motion.div>

      <motion.div
        className="mt-4 max-h-[420px] min-h-[220px] overflow-y-auto"
        variants={item}
      >
        <div className="space-y-3 md:hidden">
          {matchHistory.map((match) => {
            const tone = getResultTone(match.result);
            const teamTone = getTeamTone(match.result);
            const scores = getScoreLines(match.result, match.score);

            return (
              <div
                key={`card-${match.date}-${match.versus}-${match.score}`}
                className="rounded-2xl border border-white/10 bg-linear-to-br from-white/8 via-white/4 to-transparent px-4 py-4 shadow-[0_16px_35px_rgba(0,0,0,0.4)] ring-1 ring-white/10"
              >
                <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-white/50">
                  <span>{match.date}</span>
                  <span
                    className={`rounded-full border px-3 py-1 text-[10px] font-semibold ${tone}`}
                  >
                    {match.result}
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-[1fr_auto] items-center gap-3">
                  <div className="flex flex-col gap-1 text-sm">
                    <span className={teamTone.club}>{clubName}</span>
                    <span className={teamTone.opponent}>{match.versus}</span>
                  </div>
                  <div className="text-right text-sm font-semibold">
                    <div className={teamTone.club}>{scores.clubScore}</div>
                    {scores.opponentScore && (
                      <div className={teamTone.opponent}>
                        {scores.opponentScore}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="hidden md:block">
          <table className="min-w-full border-separate border-spacing-y-2 text-left">
            <thead className="text-[10px] uppercase tracking-[0.28em] text-white/50">
              <tr>
                <th className="px-4 py-2">Date</th>
                <th className="px-4 py-2">Match</th>
                <th className="px-4 py-2 text-right">Score</th>
                <th className="px-4 py-2 text-right">Result</th>
              </tr>
            </thead>
            <tbody className="text-white">
              {matchHistory.map((match) => {
                const tone = getResultTone(match.result);
                const teamTone = getTeamTone(match.result);
                const scores = getScoreLines(match.result, match.score);

                return (
                  <tr key={`${match.date}-${match.versus}-${match.score}`}>
                    <td className="rounded-l-2xl bg-white/5 px-4 py-3 text-sm text-white/70">
                      {match.date}
                    </td>
                    <td className="bg-white/5 px-4 py-3">
                      <div className="flex flex-col gap-1 text-sm">
                        <span className={teamTone.club}>{clubName}</span>
                        <span className={teamTone.opponent}>{match.versus}</span>
                      </div>
                    </td>
                    <td className="bg-white/5 px-4 py-3 text-right">
                      <div className="flex flex-col gap-1 text-sm font-semibold">
                        <span className={teamTone.club}>{scores.clubScore}</span>
                        {scores.opponentScore && (
                          <span className={teamTone.opponent}>
                            {scores.opponentScore}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="rounded-r-2xl bg-white/5 px-4 py-3 text-right">
                      <span
                        className={`inline-flex min-w-[80px] justify-center rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] ${tone}`}
                      >
                        {match.result}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.section>
  );
}

