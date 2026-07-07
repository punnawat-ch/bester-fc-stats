"use client";

import { motion, useReducedMotion } from "framer-motion";

import type { MatchHistory } from "../data/football-stats";

type MatchHistoryTableProps = Readonly<{
  matchHistory: MatchHistory[];
  clubName: string;
  embedded?: boolean;
}>;

const resultStyles: Record<string, string> = {
  win: "border-success/60 bg-success/10 text-success-fg",
  loss: "border-danger/60 bg-danger/10 text-danger-fg",
  draw: "border-border-strong bg-glass text-fg-muted",
};

function getResultTone(result: string) {
  const key = result.trim().toLowerCase();
  return resultStyles[key] ?? "border-border bg-glass text-fg-muted";
}

function getTeamTone(result: string) {
  const key = result.trim().toLowerCase();
  if (key === "win") {
    return { club: "text-fg font-semibold", opponent: "text-fg-muted" };
  }
  if (key === "loss") {
    return { club: "text-fg-subtle", opponent: "text-fg font-semibold" };
  }
  return { club: "text-fg-muted", opponent: "text-fg-muted" };
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
  embedded = false,
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

  const hasResults = matchHistory.length > 0;

  const emptyState = (
    <div className="rounded-2xl border border-border bg-glass px-4 py-8 text-center text-sm text-fg-muted">
      No results recorded yet. Match outcomes will appear here.
    </div>
  );

  const results = (
    <>
      <div className="space-y-3 md:hidden">
          {matchHistory.map((match) => {
            const tone = getResultTone(match.result);
            const teamTone = getTeamTone(match.result);
            const scores = getScoreLines(match.result, match.score);

            return (
              <div
                key={`card-${match.date}-${match.versus}-${match.score}`}
                className="rounded-2xl border border-border bg-linear-to-br from-glass-2 via-glass to-transparent px-4 py-4 shadow-panel-sm ring-1 ring-border"
              >
                <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-fg-subtle">
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
            <thead className="text-[10px] uppercase tracking-[0.28em] text-fg-subtle">
              <tr>
                <th className="px-4 py-2">Date</th>
                <th className="px-4 py-2">Match</th>
                <th className="px-4 py-2 text-right">Score</th>
                <th className="px-4 py-2 text-right">Result</th>
              </tr>
            </thead>
            <tbody className="text-fg">
              {matchHistory.map((match) => {
                const tone = getResultTone(match.result);
                const teamTone = getTeamTone(match.result);
                const scores = getScoreLines(match.result, match.score);

                return (
                  <tr key={`${match.date}-${match.versus}-${match.score}`}>
                    <td className="rounded-l-2xl bg-glass px-4 py-3 text-sm text-fg-muted">
                      {match.date}
                    </td>
                    <td className="bg-glass px-4 py-3">
                      <div className="flex flex-col gap-1 text-sm">
                        <span className={teamTone.club}>{clubName}</span>
                        <span className={teamTone.opponent}>{match.versus}</span>
                      </div>
                    </td>
                    <td className="bg-glass px-4 py-3 text-right">
                      <div className="flex flex-col gap-1 text-sm font-semibold">
                        <span className={teamTone.club}>{scores.clubScore}</span>
                        {scores.opponentScore && (
                          <span className={teamTone.opponent}>
                            {scores.opponentScore}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="rounded-r-2xl bg-glass px-4 py-3 text-right">
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
    </>
  );

  const body = hasResults ? results : emptyState;

  if (embedded) {
    return (
      <motion.div variants={container} initial="hidden" animate="show">
        <motion.div variants={item} className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-border bg-glass px-3 py-1 text-[10px] uppercase tracking-[0.24em] text-fg-muted">
            {matchHistory.length} results
          </span>
        </motion.div>
        <motion.div
          className="mt-5 max-h-[420px] min-h-[220px] overflow-y-auto"
          variants={item}
        >
          {body}
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.section
      className="glass-panel rounded-3xl border border-border bg-panel/80 px-5 py-5 shadow-panel-lg ring-1 ring-border"
      variants={container}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.4 }}
    >
      <motion.div className="flex items-center justify-between" variants={item}>
        <div>
          <p className="text-[10px] uppercase tracking-[0.32em] text-fg-subtle">
            Results
          </p>
          <h3 className="text-lg font-semibold text-fg">Match History</h3>
        </div>
        <span className="rounded-full border border-border bg-glass px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-fg-muted">
          Results
        </span>
      </motion.div>

      <motion.div
        className="mt-4 max-h-[420px] min-h-[220px] overflow-y-auto"
        variants={item}
      >
        {body}
      </motion.div>
    </motion.section>
  );
}

