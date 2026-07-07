"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useMemo } from "react";

import type { PlayerStats } from "../lib/football";
import { useUIState } from "../context/ui-state-context";
import HighlightRow from "./HighlightRow";

type PlayerStatsTableProps = Readonly<{
  players: PlayerStats[];
}>;

// Client component: sorting + highlighting require client-side UI state.
export default function PlayerStatsTable({
  players,
}: PlayerStatsTableProps) {
  const reduceMotion = useReducedMotion();
  const { viewMode, setViewMode, highlightLeaders, setHighlightLeaders } =
    useUIState();
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

  const rankedGoals = useMemo(
    () => [...players].sort((a, b) => b.goals - a.goals),
    [players],
  );
  const rankedAssists = useMemo(
    () => [...players].sort((a, b) => b.assists - a.assists),
    [players],
  );

  const isCompact = viewMode === "compact";
  const rowText = isCompact ? "text-xs" : "text-base";
  const cellPadding = isCompact ? "px-3 py-2" : "px-4 py-3";
  const titleSize = isCompact ? "text-base" : "text-lg";
  const showTop = isCompact ? 5 : players.length;

  const renderRanking = (
    title: string,
    accent: string,
    playersRanked: PlayerStats[],
    metric: "goals" | "assists" | "cleanSheets",
  ) => {
    const leader = playersRanked[0];
    const getPodiumStyles = (index: number) => {
      if (index === 0) {
        return {
          border: "border-podium-gold/60",
          badge: "bg-podium-gold/20 text-podium-gold",
          label: "🏆 Top 1",
        };
      }
      if (index === 1) {
        return {
          border: "border-podium-silver/60",
          badge: "bg-podium-silver/20 text-podium-silver",
          label: "Top 2",
        };
      }
      if (index === 2) {
        return {
          border: "border-podium-bronze/60",
          badge: "bg-podium-bronze/20 text-podium-bronze",
          label: "Top 3",
        };
      }
      return {
        border: "border-border",
        badge: "bg-glass-3 text-fg-muted",
        label: "",
      };
    };

    return (
      <div className="glass-panel rounded-2xl border border-border bg-linear-to-br from-glass-3 via-glass to-transparent p-4 shadow-panel ring-1 ring-border">
        <div className="flex flex-col gap-3">
          <div>
            <h3 className={`${titleSize} font-semibold text-fg`}>{title}</h3>
            {!isCompact && (
              <p className="text-[10px] uppercase tracking-[0.3em] text-fg-subtle">
                Competition Ranking
              </p>
            )}
          </div>

          {leader && (
            <span
              className={`rounded-full w-max px-3 py-1 text-[10px] uppercase tracking-[0.3em] ${accent}`}
            >
              Leader: {leader.name}
            </span>
          )}
        </div>
        <div className="mt-4 space-y-3 md:hidden">
          {playersRanked.slice(0, showTop).map((player, index) => {
            const podium = getPodiumStyles(index);

            return (
              <div
                key={`${metric}-card-${player.name}`}
                className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-linear-to-br from-glass-2 via-glass to-transparent px-4 py-3 shadow-panel-sm ring-1 ring-border"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`flex h-10 w-10 items-center justify-center rounded-full border text-base font-semibold ${podium.border}`}
                  >
                    {index + 1}
                  </span>
                  <div className="flex flex-col">
                    <span className="font-semibold text-fg">
                      {player.name}
                    </span>
                    {podium.label ? (
                      <span
                        className={`mt-1 inline-flex w-fit rounded-full px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] ${podium.badge}`}
                      >
                        {podium.label}
                      </span>
                    ) : null}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] uppercase tracking-[0.24em] text-fg-subtle">
                    {title}
                  </div>
                  <div className="text-lg font-semibold text-fg">{player[metric]}</div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 hidden overflow-x-auto md:block">
          <table className="min-w-full border-separate border-spacing-y-2 text-left table-fixed">
            {!isCompact && (
              <thead className="text-[10px] uppercase tracking-[0.28em] text-fg-subtle">
              <tr>
                <th className="py-2 w-4">Rank</th>
                <th className="px-6 w-full py-2">Player</th>
                <th className="py-2 text-right w-4">Total</th>
              </tr>
            </thead>
            )}
            <tbody className={`text-fg ${rowText}`}>
              {playersRanked.slice(0, showTop).map((player, index) => {
                const isLeader = highlightLeaders && leader?.name === player.name;
                const total = player[metric];
                const isPodium = index < 3;
                const podium = getPodiumStyles(index);

                return (
                  <HighlightRow
                    key={`${metric}-${player.name}`}
                    isHighlighted={isLeader}
                  >
                    <td
                      className={`rounded-l-2xl w-4 bg-glass ${cellPadding} font-medium text-fg-muted ${
                        isPodium ? `border-l-2 ${podium.border}` : ""
                      }`}
                    >
                      {index + 1}
                    </td>
                    <td className={`bg-glass ${cellPadding} font-medium w-full`}>
                      <div className="flex items-center gap-2">
                        <div className="flex flex-col">
                          <span>{player.name}</span>
                          <span className="text-xs text-fg-subtle">
                            {player.matchesPlayed} matches
                          </span>
                        </div>
                        {!isCompact && isPodium && (
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] ${podium.badge}`}
                          >
                            {podium.label}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className={`rounded-r-2xl bg-glass ${cellPadding} text-right w-4 ${isCompact ? "text-sm" : "text-lg"} font-semibold`}>
                      {total}
                    </td>
                  </HighlightRow>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <motion.section
      className="glass-panel rounded-3xl border border-border bg-panel/80 px-5 py-5 shadow-panel-lg ring-1 ring-border"
      variants={container}
      initial="hidden"
      animate="show"
    >
      <motion.div
        className="flex flex-wrap items-center justify-between gap-4"
        variants={item}
      >
        <div>
          <p className="text-[10px] uppercase tracking-[0.32em] text-fg-subtle">
            Ranking Stage
          </p>
          <h2 className="text-xl font-semibold text-fg">
            Competition Rankings
          </h2>
          <p className="text-xs text-fg-muted">
            Goals, Assists, and Clean Sheets leaders
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <div className="flex rounded-full border border-border bg-glass p-1">
            <button
              type="button"
              className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide transition ${
                viewMode === "table"
                  ? "bg-primary text-primary-foreground"
                  : "text-fg-muted hover:text-fg"
              }`}
              onClick={() => setViewMode("table")}
            >
              Table
            </button>
            <button
              type="button"
              className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide transition ${
                viewMode === "compact"
                  ? "bg-primary text-primary-foreground"
                  : "text-fg-muted hover:text-fg"
              }`}
              onClick={() => setViewMode("compact")}
            >
              Compact
            </button>
          </div>
          <label className="flex items-center gap-2 text-xs uppercase tracking-wide text-fg-muted">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-border-strong bg-glass-3 text-success"
              checked={highlightLeaders}
              onChange={(event) => setHighlightLeaders(event.target.checked)}
            />
            <span>Highlight leaders</span>
          </label>
        </div>
      </motion.div>

      <motion.div className="mt-6 grid gap-4 lg:grid-cols-2" variants={item}>
        {renderRanking(
          "Goals",
          "bg-success/20 text-success-fg",
          rankedGoals,
          "goals",
        )}
        {renderRanking(
          "Assists",
          "bg-info/20 text-info-fg",
          rankedAssists,
          "assists",
        )}
      </motion.div>
    </motion.section>
  );
}

