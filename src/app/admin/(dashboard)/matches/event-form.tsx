"use client";

import { useEffect, useRef } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Clock, Hash, MapPin } from "lucide-react";
import { useForm, useFormContext, useWatch } from "react-hook-form";

import { SubmitBar } from "@/components/admin/SubmitBar";
import { FeatureTour } from "@/components/admin/help/FeatureTour";
import { HelpButton } from "@/components/admin/help/HelpButton";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

import { DateField } from "./date-field";
import { suggestMatchweek, toDateInputValue, type MatchDTO } from "./lib";
import { RecurrenceFields } from "./recurrence-fields";
import { matchFormSchema, type MatchFormValues } from "./schema";

type EventFormProps = Readonly<{
  match: MatchDTO | null;
  initialDate: string;
  submitLabel: string;
  allowRecurrence: boolean;
  onSubmit: (values: MatchFormValues) => Promise<boolean>;
  onCancel: () => void;
}>;

const DEFAULT_START = "18:00";
const DEFAULT_END = "20:00";

function buildDefaults(
  match: MatchDTO | null,
  initialDate: string,
): MatchFormValues {
  if (match) {
    return {
      opponent: match.opponent,
      date: toDateInputValue(new Date(match.y, match.m, match.d)),
      allDay: match.kickoff === null,
      startTime: match.startTime ?? DEFAULT_START,
      endTime: match.endTime ?? DEFAULT_END,
      venue: match.venue ?? "",
      field: match.field ?? "",
      matchweek: match.matchweek ?? "",
      notes: match.notes ?? "",
      recurrence: { enabled: false, until: "" },
    };
  }
  return {
    opponent: "",
    date: initialDate,
    allDay: false,
    startTime: DEFAULT_START,
    endTime: DEFAULT_END,
    venue: "",
    field: "",
    matchweek: suggestMatchweek(initialDate),
    notes: "",
    recurrence: { enabled: false, until: "" },
  };
}

/**
 * EventForm — the Google-Calendar-style create/edit fixture form (RHF + Zod).
 * Fields map to Match: Title→opponent, date, kickoff time range→"HH:MM–HH:MM",
 * All-day/TBD→kickoff null, venue+field, auto-suggested matchweek, recurrence,
 * notes (admin-ux-spec §4.5.2).
 */
export function EventForm({
  match,
  initialDate,
  submitLabel,
  allowRecurrence,
  onSubmit,
  onCancel,
}: EventFormProps) {
  const form = useForm<MatchFormValues>({
    resolver: zodResolver(matchFormSchema),
    defaultValues: buildDefaults(match, initialDate),
    mode: "onBlur",
  });

  const submit = form.handleSubmit(async (values) => {
    const ok = await onSubmit(values);
    if (ok) {
      form.reset(values);
    }
  });

  const { isDirty, isSubmitting } = form.formState;
  const isCreate = match === null;

  return (
    <Form {...form}>
      {isCreate ? <FeatureTour featureKey="match-editor" /> : null}
      <form onSubmit={submit} className="flex flex-col gap-4">
        <div className="flex justify-end pr-10">
          <HelpButton featureKey="match-editor" />
        </div>

        <div data-tour="match-opponent">
          <FormField
            control={form.control}
            name="opponent"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel htmlFor="match-opponent">Opponent</FormLabel>
                <div className="flex items-center gap-2">
                  <span
                    aria-hidden="true"
                    className="font-mono text-sm text-fg-subtle"
                  >
                    vs
                  </span>
                  <FormControl>
                    <Input
                      id="match-opponent"
                      placeholder="No Doubt"
                      autoComplete="off"
                      aria-invalid={Boolean(fieldState.error)}
                      {...field}
                    />
                  </FormControl>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex flex-col gap-4" data-tour="match-datetime">
          <FormField
            control={form.control}
            name="date"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel htmlFor="match-date">Date</FormLabel>
                <FormControl>
                  <DateField
                    id="match-date"
                    value={field.value}
                    onChange={field.onChange}
                    invalid={Boolean(fieldState.error)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <TimeRangeFields />
        </div>

        <div
          className="grid grid-cols-1 gap-4 sm:grid-cols-2"
          data-tour="match-venue"
        >
          <FormField
            control={form.control}
            name="venue"
            render={({ field }) => (
              <FormItem>
                <FormLabel htmlFor="match-venue" className="gap-2">
                  <MapPin className="size-4 text-fg-muted" aria-hidden="true" />
                  Venue
                </FormLabel>
                <FormControl>
                  <Input id="match-venue" placeholder="Playmaker" {...field} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="field"
            render={({ field }) => (
              <FormItem>
                <FormLabel htmlFor="match-field">Field</FormLabel>
                <FormControl>
                  <Input id="match-field" placeholder="Field 3" {...field} />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <MatchweekField />

        {allowRecurrence ? <RecurrenceFields /> : null}

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel htmlFor="match-notes">Notes</FormLabel>
              <FormControl>
                <Textarea
                  id="match-notes"
                  rows={2}
                  placeholder="Optional notes"
                  className="rounded-2xl border-border bg-panel-2/60 text-fg"
                  {...field}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <div data-tour="match-save">
          <SubmitBar
            saveLabel={submitLabel}
            pending={isSubmitting}
            disabled={!isDirty}
            onCancel={onCancel}
          />
        </div>
      </form>
    </Form>
  );
}

function TimeRangeFields() {
  const form = useFormContext<MatchFormValues>();
  const allDay = useWatch({ control: form.control, name: "allDay" });

  return (
    <div className="flex flex-col gap-3">
      <FormField
        control={form.control}
        name="allDay"
        render={({ field }) => (
          <FormItem className="flex-row items-center justify-between gap-3">
            <FormLabel className="gap-2">
              <Clock className="size-4 text-fg-muted" aria-hidden="true" />
              All-day / TBD time
            </FormLabel>
            <FormControl>
              <Switch
                checked={field.value ?? false}
                onCheckedChange={field.onChange}
                aria-label="All-day or time to be decided"
              />
            </FormControl>
          </FormItem>
        )}
      />

      {allDay ? null : (
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="startTime"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel htmlFor="match-start">Start</FormLabel>
                <FormControl>
                  <Input
                    id="match-start"
                    type="time"
                    aria-invalid={Boolean(fieldState.error)}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="endTime"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel htmlFor="match-end">End</FormLabel>
                <FormControl>
                  <Input
                    id="match-end"
                    type="time"
                    aria-invalid={Boolean(fieldState.error)}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      )}
    </div>
  );
}

function MatchweekField() {
  const form = useFormContext<MatchFormValues>();
  const date = useWatch({ control: form.control, name: "date" });
  const touched = useRef(false);

  useEffect(() => {
    if (touched.current) {
      return;
    }
    const current = form.getValues("matchweek");
    if (!current) {
      form.setValue("matchweek", suggestMatchweek(date));
    }
  }, [date, form]);

  return (
    <FormField
      control={form.control}
      name="matchweek"
      render={({ field }) => (
        <FormItem>
          <FormLabel htmlFor="match-week" className="gap-2">
            <Hash className="size-4 text-fg-muted" aria-hidden="true" />
            Matchweek
          </FormLabel>
          <FormControl>
            <Input
              id="match-week"
              placeholder="Week 2"
              {...field}
              onChange={(event) => {
                touched.current = true;
                field.onChange(event);
              }}
            />
          </FormControl>
          <FormDescription>Auto-suggested from the date.</FormDescription>
        </FormItem>
      )}
    />
  );
}
