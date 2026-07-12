"use client";

import { CalendarRange, X } from "lucide-react";
import type { DateRange } from "react-day-picker";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const SHORT_DATE = new Intl.DateTimeFormat("en-US", {
  day: "numeric",
  month: "short",
});

function formatRange(range: DateRange | undefined): string {
  if (!range?.from) {
    return "All dates";
  }
  if (!range.to || range.to.getTime() === range.from.getTime()) {
    return SHORT_DATE.format(range.from);
  }
  return `${SHORT_DATE.format(range.from)} – ${SHORT_DATE.format(range.to)}`;
}

type DateRangeFilterProps = Readonly<{
  value: DateRange | undefined;
  onChange: (range: DateRange | undefined) => void;
}>;

/**
 * Agenda-mode date filter: a popover calendar in `range` mode. The trigger shows
 * the selected span (or "All dates"); a Clear button resets it.
 */
export function DateRangeFilter({ value, onChange }: DateRangeFilterProps) {
  const active = value?.from != null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant={active ? "default" : "secondary"}
          className="justify-start gap-2 sm:w-64"
          aria-label="Filter by date range"
        >
          <CalendarRange className="size-4" aria-hidden="true" />
          <span className="truncate">{formatRange(value)}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-auto p-2">
        <Calendar
          mode="range"
          selected={value}
          onSelect={onChange}
          numberOfMonths={1}
          showOutsideDays
          className="[--cell-size:2.3rem]"
        />
        {active ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="mt-1 w-full"
            onClick={() => onChange(undefined)}
          >
            <X className="size-4" aria-hidden="true" />
            Clear
          </Button>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}
