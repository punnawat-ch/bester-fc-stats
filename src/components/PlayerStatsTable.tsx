"use client";

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
  const { viewMode, setViewMode, highlightLeaders, setHighlightLeaders } =
    useUIState();

  const rankedGoals = useMemo(
    () => [...players].sort((a, b) => b.goals - a.goals),
    [players],
  );
  const rankedAssists = useMemo(
    () => [...players].sort((a, b) => b.assists - a.assists),
    [players],
  );
  const rankedCleanSheets = useMemo(
    () => [...players].sort((a, b) => b.cleanSheets - a.cleanSheets),
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

    return (
      <div className="glass-panel rounded-2xl border border-white/10 bg-linear-to-br from-white/10 via-white/5 to-transparent p-4 shadow-[0_18px_50px_rgba(0,0,0,0.35)]">
        <div className="flex flex-col  gap-3">
          <div>
          <h3 className={`${titleSize} font-semibold text-white`}>{title}</h3>
          {!isCompact && (
            <p className="text-xs uppercase tracking-[0.3em] text-white/50">
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
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-y-2 text-left table-fixed">
            {!isCompact && (
              <thead className="text-xs uppercase tracking-[0.2em] text-white/50">
              <tr>
                <th className="py-2 w-4">Rank</th>
                <th className="px-6 w-full py-2">Player</th>
                <th className="py-2 text-right w-4">Total</th>
              </tr>
            </thead>
            )}
            <tbody className={`text-white ${rowText}`}>
              {playersRanked.slice(0, showTop).map((player, index) => {
                const isLeader = highlightLeaders && leader?.name === player.name;
                const total = player[metric];
                const isPodium = index < 3;
                const podiumTone =
                  index === 0
                    ? "border-amber-300/60"
                    : index === 1
                      ? "border-slate-300/60"
                      : "border-orange-300/60";

                return (
                  <HighlightRow
                    key={`${metric}-${player.name}`}
                    isHighlighted={isLeader}
                  >
                    <td
                      className={`rounded-l-2xl w-4 bg-white/5 ${cellPadding} font-medium text-white/70 ${
                        isPodium ? `border-l-2 ${podiumTone}` : ""
                      }`}
                    >
                      {index + 1}
                    </td>
                    <td className={`bg-white/5 ${cellPadding} font-medium w-full`}>
                      <div className="flex items-center gap-2">
                        <div className="flex flex-col">
                          <span>{player.name}</span>
                          <span className="text-xs text-white/50">{player.matchesPlayed} matches</span>
                        </div>
                        {!isCompact && isPodium && (
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] ${
                              index === 0
                                ? "bg-amber-500/20 text-amber-100"
                                : index === 1
                                  ? "bg-slate-400/20 text-slate-100"
                                  : "bg-orange-500/20 text-orange-100"
                            }`}
                          >
                            {index === 0 ? "🏆 Top 1" : `Top ${index + 1}`}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className={`rounded-r-2xl bg-white/5 ${cellPadding} text-right w-4 ${isCompact ? "text-sm" : "text-lg"} font-semibold`}>
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
    <section className="glass-panel rounded-3xl border border-white/10 bg-[#0b1124]/85 px-6 py-6 shadow-2xl shadow-black/30">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-white">Ranking Stage</h2>
          <p className="text-sm text-white/60">
            Separate rankings for Goals, Assists, and Clean Sheets
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <div className="flex rounded-full border border-white/10 bg-white/5 p-1">
            <button
              type="button"
              className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide transition ${
                viewMode === "table"
                  ? "bg-white text-[#06120c]"
                  : "text-white/60 hover:text-white"
              }`}
              onClick={() => setViewMode("table")}
            >
              Table
            </button>
            <button
              type="button"
              className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide transition ${
                viewMode === "compact"
                  ? "bg-white text-[#06120c]"
                  : "text-white/60 hover:text-white"
              }`}
              onClick={() => setViewMode("compact")}
            >
              Compact
            </button>
          </div>
          <label className="flex items-center gap-2 text-xs uppercase tracking-wide text-white/70">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-white/20 bg-white/10 text-emerald-300"
              checked={highlightLeaders}
              onChange={(event) => setHighlightLeaders(event.target.checked)}
            />
            <span>Highlight leaders</span>
          </label>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        {renderRanking(
          "Goal Ranking",
          "bg-emerald-500/20 text-emerald-100",
          rankedGoals,
          "goals",
        )}
        {renderRanking(
          "Assist Ranking",
          "bg-blue-500/20 text-blue-100",
          rankedAssists,
          "assists",
        )}
        {renderRanking(
          "Clean Sheet Ranking",
          "bg-blue-500/20 text-blue-100",
          rankedCleanSheets,
          "cleanSheets",
        )}
      </div>
    </section>
  );
}

