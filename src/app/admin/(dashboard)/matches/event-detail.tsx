"use client";

import { useState, type ReactNode } from "react";
import {
  CalendarDays,
  CheckCircle2,
  Hash,
  MapPin,
  Pencil,
  StickyNote,
  Trash2,
  Users,
} from "lucide-react";

import { StatusChip, matchStatusKind } from "@/components/admin/StatusChip";
import { SubmitBar } from "@/components/admin/SubmitBar";
import { HelpButton } from "@/components/admin/help/HelpButton";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { longDateLabel, resultFromScore, type MatchDTO, type RosterPlayer } from "./lib";
import {
  LineupEditor,
  rowsFromLineup,
  rowsToPayload,
  type LineupRow,
} from "./lineup-editor";
import { LineupSummary } from "./lineup-summary";
import { ScoreBoard } from "./scoreboard";
import type { MarkPlayedValues } from "./schema";

type EventDetailProps = Readonly<{
  match: MatchDTO;
  roster: readonly RosterPlayer[];
  canWrite: boolean;
  onEdit: (match: MatchDTO) => void;
  onDelete: (match: MatchDTO) => void;
  onMarkPlayed: (id: string, input: MarkPlayedValues) => Promise<boolean>;
}>;

type ResultOverride = "WIN" | "DRAW" | "LOSS" | null;

const RESULT_OPTIONS: ReadonlyArray<{ value: "WIN" | "DRAW" | "LOSS"; label: string }> =
  [
    { value: "WIN", label: "Win" },
    { value: "DRAW", label: "Draw" },
    { value: "LOSS", label: "Loss" },
  ];

/** Active-state colour per result, matching the scoreboard pill tones. */
const RESULT_TONE: Readonly<Record<"WIN" | "DRAW" | "LOSS", string>> = {
  WIN: "border-success/40 bg-success/15 text-success",
  DRAW: "border-warning/40 bg-warning/15 text-warning",
  LOSS: "border-danger/40 bg-danger/15 text-danger",
};

function DetailRow({
  icon,
  children,
}: Readonly<{ icon: ReactNode; children: ReactNode }>) {
  return (
    <div className="flex items-center gap-2.5 text-sm text-fg-muted">
      <span className="text-fg-subtle [&_svg]:size-4" aria-hidden="true">
        {icon}
      </span>
      {children}
    </div>
  );
}

/**
 * EventDetail — read-only fixture detail with Edit / Delete / Mark-as-played
 * (admin-ux-spec §4.5.4). "Mark as played" reveals score inputs inline and
 * transitions SCHEDULED → PLAYED, deriving the result from the score.
 */
export function EventDetail({
  match,
  roster,
  canWrite,
  onEdit,
  onDelete,
  onMarkPlayed,
}: EventDetailProps) {
  const [marking, setMarking] = useState(false);

  if (marking) {
    return (
      <MarkPlayedForm
        match={match}
        roster={roster}
        onCancel={() => setMarking(false)}
        onMarkPlayed={onMarkPlayed}
      />
    );
  }

  const isPlayed = match.status === "PLAYED";

  const location = [match.venue, match.field].filter(Boolean).join(" · ");

  return (
    <div className="flex flex-col gap-4 md:mx-auto md:w-full md:max-w-lg">
      {/* Sits just left of the dialog/sheet close button (top-4 right-4). */}
      <HelpButton
        featureKey="match-detail"
        className="absolute top-4 right-16 z-10 size-9 border-0 bg-transparent backdrop-blur-none [&_svg]:size-4"
      />
      <div className="flex flex-col gap-3">
        <StatusChip {...matchStatusKind(match.status, match.result)} />
        <p className="text-lg font-semibold text-fg">vs {match.opponent}</p>
        <div className="flex flex-col gap-2">
          <DetailRow icon={<CalendarDays />}>
            {longDateLabel(match.y, match.m, match.d)}
            {match.kickoff ? ` · ${match.kickoff}` : " · TBD"}
          </DetailRow>
          {location ? (
            <DetailRow icon={<MapPin />}>{location}</DetailRow>
          ) : null}
          {match.matchweek ? (
            <DetailRow icon={<Hash />}>{match.matchweek}</DetailRow>
          ) : null}
          {isPlayed && match.goalsFor !== null ? (
            <DetailRow icon={<CheckCircle2 />}>
              <span className="font-mono">
                {match.goalsFor}–{match.goalsAgainst}
              </span>
            </DetailRow>
          ) : null}
          {isPlayed && match.lineup.length > 0 ? (
            <DetailRow icon={<Users />}>
              {match.lineup.length === 1
                ? "1 player"
                : `${match.lineup.length} players`}
            </DetailRow>
          ) : null}
          {match.notes ? (
            <DetailRow icon={<StickyNote />}>{match.notes}</DetailRow>
          ) : null}
        </div>
      </div>

      {canWrite ? (
        <div className="flex flex-col gap-2">
          <Button
            type="button"
            size="lg"
            data-tour="match-mark-played"
            onClick={() => setMarking(true)}
            className="bg-success/90 text-fg-inverse hover:bg-success"
          >
            <CheckCircle2 aria-hidden="true" />
            {isPlayed ? "Edit result & lineup" : "Mark as played"}
          </Button>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              data-tour="match-edit"
              onClick={() => onEdit(match)}
            >
              <Pencil aria-hidden="true" />
              Edit
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="flex-1"
              data-tour="match-delete"
              onClick={() => onDelete(match)}
            >
              <Trash2 aria-hidden="true" />
              Delete
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

type MarkPlayedFormProps = Readonly<{
  match: MatchDTO;
  roster: readonly RosterPlayer[];
  onCancel: () => void;
  onMarkPlayed: (id: string, input: MarkPlayedValues) => Promise<boolean>;
}>;

function MarkPlayedForm({
  match,
  roster,
  onCancel,
  onMarkPlayed,
}: MarkPlayedFormProps) {
  const played = match.status === "PLAYED";
  const [goalsFor, setGoalsFor] = useState(
    played && match.goalsFor !== null ? String(match.goalsFor) : "0",
  );
  const [goalsAgainst, setGoalsAgainst] = useState(
    played && match.goalsAgainst !== null ? String(match.goalsAgainst) : "0",
  );
  const [override, setOverride] = useState<ResultOverride>(
    played ? match.result : null,
  );
  const [lineup, setLineup] = useState<LineupRow[]>(() =>
    rowsFromLineup(match.lineup, roster),
  );
  const [pending, setPending] = useState(false);

  const parsedFor = Number.parseInt(goalsFor, 10);
  const parsedAgainst = Number.parseInt(goalsAgainst, 10);
  const safeFor = Number.isNaN(parsedFor) ? 0 : parsedFor;
  const safeAgainst = Number.isNaN(parsedAgainst) ? 0 : parsedAgainst;
  const effectiveResult = override ?? resultFromScore(safeFor, safeAgainst);

  const handleSubmit = async () => {
    setPending(true);
    const ok = await onMarkPlayed(match.id, {
      goalsFor: safeFor,
      goalsAgainst: safeAgainst,
      result: override,
      lineup: rowsToPayload(lineup),
    });
    if (!ok) {
      setPending(false);
    }
  };

  const resultControl = (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-fg-muted">Result</span>
        <span className="text-xs text-fg-subtle">Auto · tap to override</span>
      </div>
      <div role="group" aria-label="Result" className="grid grid-cols-3 gap-2">
        {RESULT_OPTIONS.map((option) => {
          const active = effectiveResult === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => setOverride(option.value)}
              aria-pressed={active}
              className={cn(
                "rounded-xl border py-2.5 text-sm font-bold uppercase tracking-wide outline-none transition focus-visible:ring-2 focus-visible:ring-ring",
                active
                  ? RESULT_TONE[option.value]
                  : "border-border bg-glass text-fg-muted hover:text-fg",
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );

  const liveResult = (
    <span className="sr-only" aria-live="polite">
      {`Result: ${effectiveResult}`}
    </span>
  );

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        handleSubmit().catch(() => setPending(false));
      }}
      className="flex flex-col gap-5 md:grid md:grid-cols-[minmax(20rem,26rem)_minmax(0,1fr)] md:items-start md:gap-6"
    >
      {/* Left (desktop) / top (mobile): score, live summary, result, actions. */}
      <div className="flex flex-col gap-4 md:sticky md:top-0">
        <ScoreBoard
          opponent={match.opponent}
          goalsFor={goalsFor}
          goalsAgainst={goalsAgainst}
          result={effectiveResult}
          onGoalsForChange={setGoalsFor}
          onGoalsAgainstChange={setGoalsAgainst}
        />
        <LineupSummary rows={lineup} teamGoals={safeFor} />
        {resultControl}
        <div className="hidden md:block">
          <SubmitBar
            variant="page"
            saveLabel="Save result"
            pending={pending}
            onCancel={onCancel}
          >
            {liveResult}
          </SubmitBar>
        </div>
      </div>

      {/* Right (desktop) / bottom (mobile): the lineup + the mobile sticky bar. */}
      <div className="flex min-w-0 flex-col gap-4">
        <LineupEditor roster={roster} rows={lineup} onChange={setLineup} />
        <div className="md:hidden">
          <SubmitBar
            saveLabel="Save result"
            pending={pending}
            onCancel={onCancel}
          >
            {liveResult}
          </SubmitBar>
        </div>
      </div>
    </form>
  );
}
