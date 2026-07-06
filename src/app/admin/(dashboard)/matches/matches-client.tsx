"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarPlus, Plus } from "lucide-react";
import { toast } from "sonner";

import { EmptyState } from "@/components/admin/EmptyState";
import { PageHeader } from "@/components/admin/PageHeader";
import { ConfirmSheet } from "@/components/admin/ConfirmSheet";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

import { AgendaView } from "./agenda-view";
import { DaySheet } from "./day-sheet";
import { EventDetail } from "./event-detail";
import { EventForm } from "./event-form";
import { MonthView } from "./month-view";
import { ResponsiveModal } from "./responsive-modal";
import { ScopeSheet, type ScopeCounts } from "./scope-sheet";
import {
  createMatch,
  deleteMatch,
  markMatchPlayed,
  updateMatch,
  type ActionResult,
} from "./action";
import { toDateInputValue, type MatchDTO } from "./lib";
import type {
  MarkPlayedValues,
  MatchFormValues,
  SeriesScope,
} from "./schema";

type MatchesClientProps = Readonly<{
  matches: readonly MatchDTO[];
  canWrite: boolean;
}>;

type CalendarView = "agenda" | "month";
type MatchFilter = "scheduled" | "played" | "all";
type ScopeState = { match: MatchDTO; mode: "edit" | "delete" };

const FILTERS: ReadonlyArray<{ value: MatchFilter; label: string }> = [
  { value: "scheduled", label: "Scheduled" },
  { value: "played", label: "Played" },
  { value: "all", label: "All" },
];

const ERROR_MESSAGES: Readonly<Record<string, string>> = {
  VALIDATION: "Please check the form and try again.",
  FORBIDDEN: "You do not have permission to do that.",
  NOT_FOUND: "That fixture no longer exists.",
  SERVER_ERROR: "Something went wrong. Please try again.",
};

function matchesFilter(match: MatchDTO, filter: MatchFilter): boolean {
  if (filter === "all") {
    return true;
  }
  if (filter === "scheduled") {
    return match.status === "SCHEDULED";
  }
  return match.status === "PLAYED";
}

function seriesCounts(
  match: MatchDTO,
  matches: readonly MatchDTO[],
): ScopeCounts {
  const series = matches.filter(
    (item) => item.seriesId !== null && item.seriesId === match.seriesId,
  );
  const following = series.filter(
    (item) => item.dateISO >= match.dateISO,
  ).length;
  return { this: 1, following, all: series.length };
}

function pluralFixtures(count: number): string {
  return count === 1 ? "1 fixture" : `${count} fixtures`;
}

export function MatchesClient({ matches, canWrite }: MatchesClientProps) {
  const router = useRouter();
  const [view, setView] = useState<CalendarView>("agenda");
  const [filter, setFilter] = useState<MatchFilter>("scheduled");

  const [detailMatch, setDetailMatch] = useState<MatchDTO | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formMatch, setFormMatch] = useState<MatchDTO | null>(null);
  const [formScope, setFormScope] = useState<SeriesScope | undefined>(undefined);
  const [formDate, setFormDate] = useState(() => toDateInputValue(new Date()));

  const [scopeState, setScopeState] = useState<ScopeState | null>(null);
  const [confirmMatch, setConfirmMatch] = useState<MatchDTO | null>(null);
  const [daySheet, setDaySheet] = useState<{
    day: { y: number; m: number; d: number };
    matches: MatchDTO[];
  } | null>(null);
  const [deletePending, setDeletePending] = useState(false);

  const visible = useMemo(() => {
    return matches
      .filter((match) => matchesFilter(match, filter))
      .toSorted((a, b) => a.dateISO.localeCompare(b.dateISO));
  }, [matches, filter]);

  async function runAction(
    promise: Promise<ActionResult>,
    success: (result: ActionResult & { ok: true }) => string,
  ): Promise<boolean> {
    const result = await promise;
    if (result.ok) {
      toast.success(success(result));
      router.refresh();
      return true;
    }
    toast.error(ERROR_MESSAGES[result.error] ?? ERROR_MESSAGES.SERVER_ERROR);
    return false;
  }

  function openCreate(dateStr: string) {
    setFormMatch(null);
    setFormScope(undefined);
    setFormDate(dateStr);
    setFormOpen(true);
    setDaySheet(null);
  }

  function openEdit(match: MatchDTO, scope: SeriesScope | undefined) {
    setFormMatch(match);
    setFormScope(scope);
    setFormDate(toDateInputValue(new Date(match.y, match.m, match.d)));
    setFormOpen(true);
  }

  function handleEdit(match: MatchDTO) {
    setDetailMatch(null);
    if (match.seriesId) {
      setScopeState({ match, mode: "edit" });
      return;
    }
    openEdit(match, undefined);
  }

  function handleDelete(match: MatchDTO) {
    setDetailMatch(null);
    if (match.seriesId) {
      setScopeState({ match, mode: "delete" });
      return;
    }
    setConfirmMatch(match);
  }

  async function handleFormSubmit(values: MatchFormValues): Promise<boolean> {
    if (formMatch) {
      const ok = await runAction(
        updateMatch({ ...values, id: formMatch.id }, formScope),
        () => "Fixture updated",
      );
      if (ok) {
        setFormOpen(false);
      }
      return ok;
    }
    const ok = await runAction(createMatch(values), (result) =>
      result.count && result.count > 1
        ? `Created ${pluralFixtures(result.count)}`
        : "Fixture created",
    );
    if (ok) {
      setFormOpen(false);
    }
    return ok;
  }

  async function handleMarkPlayed(
    id: string,
    input: MarkPlayedValues,
  ): Promise<boolean> {
    const ok = await runAction(
      markMatchPlayed(id, input),
      () => "Marked as played",
    );
    if (ok) {
      setDetailMatch(null);
    }
    return ok;
  }

  async function runDelete(id: string, scope: SeriesScope | undefined) {
    setDeletePending(true);
    const ok = await runAction(deleteMatch(id, scope), (result) =>
      `Deleted ${pluralFixtures(result.count ?? 1)}`,
    );
    setDeletePending(false);
    if (ok) {
      setScopeState(null);
      setConfirmMatch(null);
    }
  }

  function handleScopeConfirm(scope: SeriesScope) {
    if (!scopeState) {
      return;
    }
    if (scopeState.mode === "edit") {
      const target = scopeState.match;
      setScopeState(null);
      openEdit(target, scope);
      return;
    }
    runDelete(scopeState.match.id, scope).catch(() => setDeletePending(false));
  }

  function handleDayClick(date: Date) {
    const y = date.getFullYear();
    const m = date.getMonth();
    const d = date.getDate();
    const dayMatches = matches.filter(
      (match) => match.y === y && match.m === m && match.d === d,
    );
    if (dayMatches.length > 0) {
      setDaySheet({ day: { y, m, d }, matches: dayMatches });
      return;
    }
    if (canWrite) {
      openCreate(toDateInputValue(date));
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        eyebrow="Schedule"
        title="Matches"
        count={matches.length}
        actions={
          <Tabs
            value={view}
            onValueChange={(value) => setView(value as CalendarView)}
          >
            <TabsList>
              <TabsTrigger value="agenda">Agenda</TabsTrigger>
              <TabsTrigger value="month">Month</TabsTrigger>
            </TabsList>
          </Tabs>
        }
      />

      <div
        role="group"
        aria-label="Filter fixtures"
        className="flex items-center gap-2"
      >
        {FILTERS.map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={filter === option.value}
            onClick={() => setFilter(option.value)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-medium transition focus-visible:ring-2 focus-visible:ring-sky-400/70 focus-visible:outline-none",
              filter === option.value
                ? "border-sky-400/40 bg-sky-500/15 text-sky-100"
                : "border-white/10 bg-white/5 text-white/60 hover:text-white",
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      {view === "month" ? (
        <MonthView matches={visible} onDayClick={handleDayClick} />
      ) : (
        <AgendaContent
          matches={visible}
          canWrite={canWrite}
          onSelect={setDetailMatch}
          onAdd={() => openCreate(formDate)}
        />
      )}

      {canWrite ? (
        <Button
          type="button"
          size="icon"
          aria-label="New fixture"
          onClick={() => openCreate(toDateInputValue(new Date()))}
          className="fixed right-4 bottom-[84px] z-40 size-14 shadow-[0_20px_50px_rgba(0,0,0,0.45)] md:right-8 md:bottom-8"
        >
          <Plus className="size-6" />
        </Button>
      ) : null}

      <ResponsiveModal
        open={detailMatch !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDetailMatch(null);
          }
        }}
        title="Fixture details"
        hideTitle
      >
        {detailMatch ? (
          <EventDetail
            match={detailMatch}
            canWrite={canWrite}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onMarkPlayed={handleMarkPlayed}
          />
        ) : null}
      </ResponsiveModal>

      <ResponsiveModal
        open={formOpen}
        onOpenChange={setFormOpen}
        title={formMatch ? "Edit fixture" : "New fixture"}
      >
        {formOpen ? (
          <EventForm
            match={formMatch}
            initialDate={formDate}
            submitLabel="Save fixture"
            allowRecurrence={formMatch === null}
            onSubmit={handleFormSubmit}
            onCancel={() => setFormOpen(false)}
          />
        ) : null}
      </ResponsiveModal>

      <DaySheet
        open={daySheet !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDaySheet(null);
          }
        }}
        day={daySheet?.day ?? null}
        matches={daySheet?.matches ?? []}
        canWrite={canWrite}
        onSelectMatch={(match) => {
          setDaySheet(null);
          setDetailMatch(match);
        }}
        onAddFixture={() => {
          if (daySheet) {
            openCreate(
              toDateInputValue(
                new Date(daySheet.day.y, daySheet.day.m, daySheet.day.d),
              ),
            );
          }
        }}
      />

      {scopeState ? (
        <ScopeSheet
          open
          onOpenChange={(open) => {
            if (!open) {
              setScopeState(null);
            }
          }}
          title={
            scopeState.mode === "edit"
              ? "Edit recurring fixture"
              : "Delete recurring fixture"
          }
          danger={scopeState.mode === "delete"}
          pending={deletePending}
          counts={seriesCounts(scopeState.match, matches)}
          confirmLabel={(_, count) =>
            scopeState.mode === "edit"
              ? "Continue"
              : `Delete ${pluralFixtures(count)}`
          }
          onConfirm={handleScopeConfirm}
        />
      ) : null}

      <ConfirmSheet
        open={confirmMatch !== null}
        onOpenChange={(open) => {
          if (!open) {
            setConfirmMatch(null);
          }
        }}
        title={confirmMatch ? `Delete match vs ${confirmMatch.opponent}?` : ""}
        description="This action cannot be undone."
        confirmLabel="Delete fixture"
        pending={deletePending}
        onConfirm={() => {
          if (confirmMatch) {
            runDelete(confirmMatch.id, undefined).catch(() =>
              setDeletePending(false),
            );
          }
        }}
      />
    </div>
  );
}

type AgendaContentProps = Readonly<{
  matches: readonly MatchDTO[];
  canWrite: boolean;
  onSelect: (match: MatchDTO) => void;
  onAdd: () => void;
}>;

function AgendaContent({
  matches,
  canWrite,
  onSelect,
  onAdd,
}: AgendaContentProps) {
  if (matches.length === 0) {
    return (
      <EmptyState
        icon={<CalendarPlus />}
        eyebrow="Schedule"
        title="No fixtures here"
        description="Nothing matches this filter yet."
        action={
          canWrite ? (
            <Button type="button" onClick={onAdd}>
              <CalendarPlus />
              Add fixture
            </Button>
          ) : undefined
        }
      />
    );
  }

  return <AgendaView matches={matches} onSelect={onSelect} />;
}
