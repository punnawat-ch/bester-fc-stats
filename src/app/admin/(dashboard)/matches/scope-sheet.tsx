"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

import { ResponsiveModal } from "./responsive-modal";
import { SERIES_SCOPES, type SeriesScope } from "./schema";

export type ScopeCounts = Readonly<Record<SeriesScope, number>>;

type ScopeSheetProps = Readonly<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  counts: ScopeCounts;
  confirmLabel: (scope: SeriesScope, count: number) => string;
  danger?: boolean;
  pending?: boolean;
  onConfirm: (scope: SeriesScope) => void;
}>;

const SCOPE_LABELS: Readonly<Record<SeriesScope, string>> = {
  this: "This fixture",
  following: "This and following",
  all: "All fixtures",
};

/**
 * ScopeSheet — Google-Calendar-style recurring-edit prompt (admin-ux-spec
 * §4.5.3): a radio of this / this-and-following / all, with live occurrence
 * counts and a confirm label that reflects the chosen scope.
 */
export function ScopeSheet({
  open,
  onOpenChange,
  title,
  counts,
  confirmLabel,
  danger = false,
  pending = false,
  onConfirm,
}: ScopeSheetProps) {
  const [scope, setScope] = useState<SeriesScope>("this");

  return (
    <ResponsiveModal open={open} onOpenChange={onOpenChange} title={title}>
      <div className="flex flex-col gap-4">
        <RadioGroup
          value={scope}
          onValueChange={(value) => setScope(value as SeriesScope)}
          className="gap-2"
        >
          {SERIES_SCOPES.map((option) => (
            <Label
              key={option}
              htmlFor={`scope-${option}`}
              className="flex min-h-12 cursor-pointer items-center justify-between gap-3 rounded-2xl border border-border bg-glass-xs px-4 py-3 text-fg"
            >
              <span className="flex items-center gap-3">
                <RadioGroupItem id={`scope-${option}`} value={option} />
                {SCOPE_LABELS[option]}
              </span>
              <span className="font-mono text-xs text-fg-subtle">
                {counts[option]}
              </span>
            </Label>
          ))}
        </RadioGroup>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() => onOpenChange(false)}
            disabled={pending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant={danger ? "destructive" : "default"}
            className="flex-1"
            size="lg"
            disabled={pending}
            aria-busy={pending}
            onClick={() => onConfirm(scope)}
          >
            {confirmLabel(scope, counts[scope])}
          </Button>
        </div>
      </div>
    </ResponsiveModal>
  );
}
