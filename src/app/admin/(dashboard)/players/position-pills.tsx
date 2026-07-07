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
  GK: "bg-amber-400 text-[#061018]",
  DF: "bg-violet-400 text-[#061018]",
  MF: "bg-sky-400 text-[#061018]",
  FW: "bg-emerald-400 text-[#061018]",
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
    active: "border-transparent bg-amber-400 text-[#061018]",
    idle: "border-amber-400/25 bg-amber-400/5 text-amber-200 hover:border-amber-400/50",
  },
  {
    value: "DF",
    label: "DF",
    active: "border-transparent bg-violet-400 text-[#061018]",
    idle: "border-violet-400/25 bg-violet-400/5 text-violet-200 hover:border-violet-400/50",
  },
  {
    value: "MF",
    label: "MF",
    active: "border-transparent bg-sky-400 text-[#061018]",
    idle: "border-sky-400/25 bg-sky-400/5 text-sky-200 hover:border-sky-400/50",
  },
  {
    value: "FW",
    label: "FW",
    active: "border-transparent bg-emerald-400 text-[#061018]",
    idle: "border-emerald-400/25 bg-emerald-400/5 text-emerald-200 hover:border-emerald-400/50",
  },
  {
    value: "",
    label: "None",
    active: "border-white/20 bg-white/15 text-white",
    idle: "border-white/10 bg-white/5 text-white/60 hover:border-white/30",
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
      className={`min-h-11 rounded-xl border text-xs font-bold uppercase tracking-wide transition outline-none focus-visible:ring-2 focus-visible:ring-sky-400/70 ${
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
