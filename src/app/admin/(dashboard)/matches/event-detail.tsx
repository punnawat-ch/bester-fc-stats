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
} from "lucide-react";

import { StatusChip, matchStatusKind } from "@/components/admin/StatusChip";
import { SubmitBar } from "@/components/admin/SubmitBar";
import { HelpButton } from "@/components/admin/help/HelpButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { longDateLabel, resultFromScore, type MatchDTO } from "./lib";
import type { MarkPlayedValues } from "./schema";

type EventDetailProps = Readonly<{
  match: MatchDTO;
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

function DetailRow({
  icon,
  children,
}: Readonly<{ icon: ReactNode; children: ReactNode }>) {
  return (
    <div className="flex items-center gap-2.5 text-sm text-white/70">
      <span className="text-white/50 [&_svg]:size-4" aria-hidden="true">
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
        onCancel={() => setMarking(false)}
        onMarkPlayed={onMarkPlayed}
      />
    );
  }

  const location = [match.venue, match.field].filter(Boolean).join(" · ");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <HelpButton featureKey="match-detail" />
      </div>
      <div className="flex flex-col gap-3">
        <StatusChip {...matchStatusKind(match.status, match.result)} />
        <p className="text-lg font-semibold text-white">vs {match.opponent}</p>
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
          {match.status === "PLAYED" && match.goalsFor !== null ? (
            <DetailRow icon={<CheckCircle2 />}>
              <span className="font-mono">
                {match.goalsFor}–{match.goalsAgainst}
              </span>
            </DetailRow>
          ) : null}
          {match.notes ? (
            <DetailRow icon={<StickyNote />}>{match.notes}</DetailRow>
          ) : null}
        </div>
      </div>

      {canWrite ? (
        <div className="flex flex-col gap-2">
          {match.status === "SCHEDULED" ? (
            <Button
              type="button"
              size="lg"
              data-tour="match-mark-played"
              onClick={() => setMarking(true)}
              className="bg-emerald-500/90 text-[#08110c] hover:bg-emerald-400"
            >
              <CheckCircle2 aria-hidden="true" />
              Mark as played
            </Button>
          ) : null}
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
  onCancel: () => void;
  onMarkPlayed: (id: string, input: MarkPlayedValues) => Promise<boolean>;
}>;

function MarkPlayedForm({ match, onCancel, onMarkPlayed }: MarkPlayedFormProps) {
  const [goalsFor, setGoalsFor] = useState("0");
  const [goalsAgainst, setGoalsAgainst] = useState("0");
  const [override, setOverride] = useState<ResultOverride>(null);
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
    });
    if (!ok) {
      setPending(false);
    }
  };

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        handleSubmit().catch(() => setPending(false));
      }}
      className="flex flex-col gap-4"
    >
      <p className="text-sm text-white/60">
        Enter the final score for the match vs {match.opponent}.
      </p>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="goals-for">Bester</Label>
          <Input
            id="goals-for"
            type="number"
            inputMode="numeric"
            min={0}
            value={goalsFor}
            onChange={(event) => setGoalsFor(event.target.value)}
            className="text-center font-mono text-lg"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="goals-against">{match.opponent}</Label>
          <Input
            id="goals-against"
            type="number"
            inputMode="numeric"
            min={0}
            value={goalsAgainst}
            onChange={(event) => setGoalsAgainst(event.target.value)}
            className="text-center font-mono text-lg"
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-white/70">Result</span>
        <div
          role="group"
          aria-label="Result"
          className="grid grid-cols-3 gap-2"
        >
          {RESULT_OPTIONS.map((option) => (
            <Button
              key={option.value}
              type="button"
              variant={effectiveResult === option.value ? "default" : "secondary"}
              onClick={() => setOverride(option.value)}
              aria-pressed={effectiveResult === option.value}
            >
              {option.label}
            </Button>
          ))}
        </div>
        <p className="text-xs text-white/50">
          Auto-derived from the score; tap to override.
        </p>
      </div>

      <SubmitBar
        saveLabel="Save result"
        pending={pending}
        onCancel={onCancel}
      >
        <span className="sr-only" aria-live="polite">
          {`Result: ${effectiveResult}`}
        </span>
      </SubmitBar>
    </form>
  );
}
