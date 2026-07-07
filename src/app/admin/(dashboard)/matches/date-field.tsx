"use client";

import { CalendarDays } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { longDateLabel, toDateInputValue } from "./lib";
import { useIsDesktop } from "./use-is-desktop";

type DateFieldProps = Readonly<{
  id?: string;
  value: string;
  onChange: (value: string) => void;
  min?: string;
  invalid?: boolean;
}>;

function parseValue(value: string): Date | undefined {
  if (!value) {
    return undefined;
  }
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) {
    return undefined;
  }
  return new Date(year, month - 1, day);
}

/**
 * DateField — native `type=date` on mobile (OS picker, a11y-free) and a shadcn
 * Calendar popover on desktop (admin-ux-spec §9 date/time picker decision).
 */
export function DateField({ id, value, onChange, min, invalid }: DateFieldProps) {
  const isDesktop = useIsDesktop();
  const selected = parseValue(value);

  if (!isDesktop) {
    return (
      <Input
        id={id}
        type="date"
        value={value}
        min={min}
        aria-invalid={invalid}
        onChange={(event) => onChange(event.target.value)}
      />
    );
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="secondary"
          aria-invalid={invalid}
          className="h-12 w-full justify-start font-normal"
        >
          <CalendarDays className="text-fg-muted" aria-hidden="true" />
          {selected ? (
            longDateLabel(
              selected.getFullYear(),
              selected.getMonth(),
              selected.getDate(),
            )
          ) : (
            <span className="text-fg-subtle">Pick a date</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-auto border-border bg-panel-2/95 p-2 text-fg ring-1 ring-border backdrop-blur-2xl"
      >
        <Calendar
          mode="single"
          selected={selected}
          defaultMonth={selected}
          onSelect={(date) => {
            if (date) {
              onChange(toDateInputValue(date));
            }
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
