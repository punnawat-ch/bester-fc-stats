"use client";

import type { Control } from "react-hook-form";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import type { PlayerFormValues, PlayerPosition } from "./schema";

/**
 * Front-card position badge fills — GK amber / DF violet / MF sky / FW emerald.
 * Mirrors `POSITION_BADGE` in the public `PlayerFlipCard`. Shared with the live
 * card preview so the editor and the public card read as the same colour system.
 */
export const POSITION_BADGE: Record<PlayerPosition, string> = {
  GK: "bg-pos-gk text-fg-inverse",
  DF: "bg-pos-df text-fg-inverse",
  MF: "bg-pos-mf text-fg-inverse",
  FW: "bg-pos-fw text-fg-inverse",
};

type PositionValue = PlayerPosition | "";

type PositionOption = Readonly<{
  value: PositionValue;
  label: string;
  active: string;
  idle: string;
}>;

const POSITION_OPTIONS: readonly PositionOption[] = [
  {
    value: "GK",
    label: "GK",
    active: "border-transparent bg-pos-gk text-fg-inverse",
    idle: "border-pos-gk/25 bg-pos-gk/5 text-pos-gk hover:border-pos-gk/50",
  },
  {
    value: "DF",
    label: "DF",
    active: "border-transparent bg-pos-df text-fg-inverse",
    idle: "border-pos-df/25 bg-pos-df/5 text-pos-df hover:border-pos-df/50",
  },
  {
    value: "MF",
    label: "MF",
    active: "border-transparent bg-pos-mf text-fg-inverse",
    idle: "border-pos-mf/25 bg-pos-mf/5 text-pos-mf hover:border-pos-mf/50",
  },
  {
    value: "FW",
    label: "FW",
    active: "border-transparent bg-pos-fw text-fg-inverse",
    idle: "border-pos-fw/25 bg-pos-fw/5 text-pos-fw hover:border-pos-fw/50",
  },
  {
    value: "",
    label: "None",
    active: "border-border-strong bg-glass-strong text-fg",
    idle: "border-border bg-glass text-fg-muted hover:border-border-hover",
  },
];

type PillProps = Readonly<{
  option: PositionOption;
  active: boolean;
  onSelect: (value: PositionValue) => void;
}>;

function PositionPill({ option, active, onSelect }: PillProps) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={() => onSelect(option.value)}
      className={`min-h-11 rounded-xl border text-xs font-bold uppercase tracking-wide transition outline-none focus-visible:ring-2 focus-visible:ring-ring ${
        active ? option.active : option.idle
      }`}
    >
      {option.label}
    </button>
  );
}

type PositionPillsProps = Readonly<{ control: Control<PlayerFormValues> }>;

/**
 * Position as a colour-coded pill group (GK/DF/MF/FW + None) instead of a plain
 * Select — matches the front-card badge palette and gives ≥44px tap targets.
 */
export function PositionPills({ control }: PositionPillsProps) {
  return (
    <FormField
      control={control}
      name="position"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Position</FormLabel>
          <FormControl>
            <div
              role="group"
              aria-label="Position"
              data-tour="player-position"
              className="grid grid-cols-5 gap-2"
            >
              {POSITION_OPTIONS.map((option) => (
                <PositionPill
                  key={option.value === "" ? "none" : option.value}
                  option={option}
                  active={field.value === option.value}
                  onSelect={field.onChange}
                />
              ))}
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
