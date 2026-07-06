"use client";

import { useState } from "react";

import type { MatchHistory } from "../data/football-stats";
import type { ScheduleMatch } from "../lib/types";
import MatchHistoryTable from "./MatchHistoryTable";
import MatchScheduleTimeline from "./MatchScheduleTimeline";

type FixturesView = "timeline" | "history";

type FixturesSectionProps = Readonly<{
  schedule: ScheduleMatch[];
  matchHistory: MatchHistory[];
  clubName: string;
}>;

const VIEWS: ReadonlyArray<{ id: FixturesView; label: string }> = [
  { id: "timeline", label: "Timeline" },
  { id: "history", label: "History" },
];

type SegmentedControlProps = Readonly<{
  value: FixturesView;
  onChange: (view: FixturesView) => void;
}>;

function SegmentedControl({ value, onChange }: SegmentedControlProps) {
  return (
    <div
      role="group"
      aria-label="Switch fixtures view"
      className="flex w-auto gap-1 rounded-full border border-white/10 bg-white/5 p-0.5"
    >
      {VIEWS.map((view) => {
        const isActive = value === view.id;
        const activeClasses = isActive
          ? "bg-white text-slate-900 shadow-[0_6px_18px_rgba(0,0,0,0.35)]"
          : "text-white/70 hover:text-white";

        return (
          <button
            key={view.id}
            type="button"
            aria-pressed={isActive}
            onClick={() => onChange(view.id)}
            className={`flex items-center justify-center rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] transition ${activeClasses}`}
          >
            {view.label}
          </button>
        );
      })}
    </div>
  );
}

export default function FixturesSection({
  schedule,
  matchHistory,
  clubName,
}: FixturesSectionProps) {
  const [view, setView] = useState<FixturesView>("timeline");

  return (
    <div className="glass-panel rounded-3xl border border-white/10 bg-[#0a1222]/80 px-5 py-5 shadow-[0_22px_60px_rgba(0,0,0,0.45)] ring-1 ring-white/10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.32em] text-white/50">
            Fixtures & Results
          </p>
          <h3 className="text-lg font-semibold text-white">Match Center</h3>
        </div>
        <SegmentedControl value={view} onChange={setView} />
      </div>

      <div className="mt-6">
        {view === "timeline" ? (
          <MatchScheduleTimeline schedule={schedule} embedded />
        ) : (
          <MatchHistoryTable
            matchHistory={matchHistory}
            clubName={clubName}
            embedded
          />
        )}
      </div>
    </div>
  );
}
