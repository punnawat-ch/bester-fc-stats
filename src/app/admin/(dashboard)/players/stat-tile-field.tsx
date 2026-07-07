"use client";

import type { ReactNode } from "react";
import { Minus, Plus } from "lucide-react";
import type { Control } from "react-hook-form";

import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import type { PlayerFormValues } from "./schema";

/** Numeric "game stat" fields shown as stepper tiles (jersey/sortOrder excluded). */
export type StatFieldName =
  | "goals"
  | "assists"
  | "matchesPlayed"
  | "cleanSheets"
  | "yellowCards"
  | "redCards"
  | "motm"
  | "saves";

export type StatTone = "emerald" | "sky" | "amber" | "rose" | "neutral";

const TONE_VALUE: Record<StatTone, string> = {
  emerald: "text-success",
  sky: "text-primary",
  amber: "text-warning",
  rose: "text-danger",
  neutral: "text-fg",
};

function clampInt(value: number): number {
  return Number.isNaN(value) ? 0 : Math.max(0, Math.trunc(value));
}

type StepButtonProps = Readonly<{
  icon: ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}>;

function StepButton({ icon, label, onClick, disabled = false }: StepButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className="grid size-11 shrink-0 place-items-center rounded-xl border border-border bg-glass text-fg outline-none transition hover:border-border-hover focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40"
    >
      {icon}
    </button>
  );
}

type StatTileFieldProps = Readonly<{
  control: Control<PlayerFormValues>;
  name: StatFieldName;
  label: string;
  tone: StatTone;
}>;

/**
 * Game-style stat tile: big tabular number with −/＋ steppers (≥44px targets)
 * that stays directly editable. Coerces empty/invalid input to 0 so the control
 * stays controlled; Zod still enforces the ≥ 0 integer rule and renders inline.
 */
export function StatTileField({ control, name, label, tone }: StatTileFieldProps) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => {
        const current = clampInt(Number(field.value));
        return (
          <FormItem className="gap-1.5 rounded-2xl border border-border bg-glass p-3">
            <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-fg-subtle">
              {label}
            </span>
            <div className="flex items-center justify-between gap-2">
              <StepButton
                icon={<Minus className="size-4" />}
                label={`Decrease ${label}`}
                onClick={() => field.onChange(Math.max(0, current - 1))}
                disabled={current <= 0}
              />
              <FormControl>
                <Input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  step={1}
                  name={field.name}
                  ref={field.ref}
                  value={field.value}
                  onBlur={field.onBlur}
                  onChange={(event) => {
                    const next = event.target.valueAsNumber;
                    field.onChange(Number.isNaN(next) ? 0 : next);
                  }}
                  className={`h-11 rounded-xl border-none bg-transparent px-0 text-center text-2xl font-extrabold tabular-nums shadow-none focus-visible:ring-0 ${TONE_VALUE[tone]}`}
                />
              </FormControl>
              <StepButton
                icon={<Plus className="size-4" />}
                label={`Increase ${label}`}
                onClick={() => field.onChange(current + 1)}
              />
            </div>
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}
