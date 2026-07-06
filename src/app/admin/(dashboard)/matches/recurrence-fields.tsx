"use client";

import { Repeat } from "lucide-react";
import { useFormContext, useWatch } from "react-hook-form";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";

import { DateField } from "./date-field";
import { weekdayName } from "./lib";
import type { MatchFormValues } from "./schema";

/**
 * RecurrenceFields — "Repeat weekly on {weekday} until {date}" control shown
 * only when creating (admin-ux-spec §4.5.3). Toggling on reveals the end-date
 * picker; the server then generates one Match row per weekly occurrence.
 */
export function RecurrenceFields() {
  const form = useFormContext<MatchFormValues>();
  const date = useWatch({ control: form.control, name: "date" });
  const enabled = useWatch({ control: form.control, name: "recurrence.enabled" });
  const weekday = weekdayName(date);

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
      <FormField
        control={form.control}
        name="recurrence.enabled"
        render={({ field }) => (
          <FormItem className="flex-row items-center justify-between gap-3">
            <FormLabel className="gap-2">
              <Repeat className="size-4 text-white/60" aria-hidden="true" />
              {enabled && weekday
                ? `Repeats weekly on ${weekday}`
                : "Repeat weekly"}
            </FormLabel>
            <FormControl>
              <Switch
                checked={field.value ?? false}
                onCheckedChange={field.onChange}
                aria-label="Repeat weekly"
              />
            </FormControl>
          </FormItem>
        )}
      />

      {enabled ? (
        <FormField
          control={form.control}
          name="recurrence.until"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel htmlFor="recurrence-until">Repeat until</FormLabel>
              <FormControl>
                <DateField
                  id="recurrence-until"
                  value={field.value ?? ""}
                  min={date}
                  onChange={field.onChange}
                  invalid={Boolean(fieldState.error)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      ) : null}
    </div>
  );
}
