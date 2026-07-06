"use client";

import { CalendarPlus } from "lucide-react";

import { Button } from "@/components/ui/button";

import { FixtureCard } from "./fixture-card";
import { longDateLabel, type MatchDTO } from "./lib";
import { ResponsiveModal } from "./responsive-modal";

type DaySheetProps = Readonly<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  day: { y: number; m: number; d: number } | null;
  matches: readonly MatchDTO[];
  canWrite: boolean;
  onSelectMatch: (match: MatchDTO) => void;
  onAddFixture: () => void;
}>;

/**
 * DaySheet — the mini day agenda shown when tapping a populated calendar day
 * (admin-ux-spec §4.5.1). Lists that day's fixtures and offers "Add fixture".
 */
export function DaySheet({
  open,
  onOpenChange,
  day,
  matches,
  canWrite,
  onSelectMatch,
  onAddFixture,
}: DaySheetProps) {
  const title = day ? longDateLabel(day.y, day.m, day.d) : "Fixtures";

  return (
    <ResponsiveModal open={open} onOpenChange={onOpenChange} title={title}>
      <div className="flex flex-col gap-3">
        {matches.map((match) => (
          <FixtureCard key={match.id} match={match} onSelect={onSelectMatch} />
        ))}
        {canWrite ? (
          <Button type="button" variant="secondary" onClick={onAddFixture}>
            <CalendarPlus aria-hidden="true" />
            Add fixture
          </Button>
        ) : null}
      </div>
    </ResponsiveModal>
  );
}
