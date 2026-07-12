import { z } from "zod";

/**
 * Zod schemas for the Matches feature. `matchFormSchema` is shared by the
 * client form (RHF resolver) and the create/update server actions so the shape
 * validated on the client is exactly what the server re-validates.
 */

const TIME_REGEX = /^\d{2}:\d{2}$/;

/** Recurring-edit / delete scope, Google-Calendar style. */
export const SERIES_SCOPES = ["this", "following", "all"] as const;
export const scopeSchema = z.enum(SERIES_SCOPES);
export type SeriesScope = z.infer<typeof scopeSchema>;

export const recurrenceSchema = z.object({
  enabled: z.boolean(),
  until: z.string(),
});
export type RecurrenceValues = z.infer<typeof recurrenceSchema>;

function refineForm(
  value: {
    allDay: boolean;
    startTime: string;
    endTime: string;
    date: string;
    recurrence?: RecurrenceValues | null;
  },
  ctx: z.RefinementCtx,
): void {
  if (!value.allDay) {
    if (!TIME_REGEX.test(value.startTime)) {
      ctx.addIssue({
        path: ["startTime"],
        code: "custom",
        message: "Start time is required",
      });
    }
    if (!TIME_REGEX.test(value.endTime)) {
      ctx.addIssue({
        path: ["endTime"],
        code: "custom",
        message: "End time is required",
      });
    }
    if (
      TIME_REGEX.test(value.startTime) &&
      TIME_REGEX.test(value.endTime) &&
      value.startTime >= value.endTime
    ) {
      ctx.addIssue({
        path: ["endTime"],
        code: "custom",
        message: "End must be after start",
      });
    }
  }
  if (value.recurrence?.enabled) {
    if (!value.recurrence.until) {
      ctx.addIssue({
        path: ["recurrence", "until"],
        code: "custom",
        message: "Choose an end date",
      });
    } else if (value.recurrence.until < value.date) {
      ctx.addIssue({
        path: ["recurrence", "until"],
        code: "custom",
        message: "End date must be after the first match",
      });
    }
  }
}

export const matchFormSchema = z
  .object({
    opponent: z.string().trim().min(1, "Opponent is required").max(120),
    date: z.string().min(1, "Date is required"),
    allDay: z.boolean(),
    startTime: z.string(),
    endTime: z.string(),
    venue: z.string().trim().max(120),
    field: z.string().trim().max(120),
    matchweek: z.string().trim().max(60),
    notes: z.string().trim().max(500),
    recurrence: recurrenceSchema.optional().nullable(),
  })
  .superRefine(refineForm);

export type MatchFormValues = z.infer<typeof matchFormSchema>;

const lineupStat = z.coerce.number().int().min(0).max(99);

/**
 * One row of a match lineup. Either references an existing player (`playerId`)
 * or names a brand-new one to create on save (`newPlayerName`) — exactly one of
 * the two must be present. The stat fields are that player's numbers for THIS
 * match only; Player.* totals are auto-summed from these rows server-side.
 */
export const lineupEntrySchema = z
  .object({
    playerId: z.string().min(1).optional(),
    newPlayerName: z.string().trim().min(1).max(80).optional(),
    goals: lineupStat,
    assists: lineupStat,
    cleanSheets: lineupStat,
    yellowCards: lineupStat,
    redCards: lineupStat,
    motm: lineupStat,
    saves: lineupStat,
  })
  .refine(
    (row) => Boolean(row.playerId) !== Boolean(row.newPlayerName),
    "Provide either an existing player or a new player name",
  );

export type LineupEntryValues = z.infer<typeof lineupEntrySchema>;

export const markPlayedSchema = z.object({
  goalsFor: z.coerce.number().int().min(0).max(99),
  goalsAgainst: z.coerce.number().int().min(0).max(99),
  result: z.enum(["WIN", "DRAW", "LOSS"]).optional().nullable(),
  // Optional — a score can be saved with no lineup (lineup is not required).
  lineup: z.array(lineupEntrySchema).max(40).default([]),
});
export type MarkPlayedValues = z.infer<typeof markPlayedSchema>;

/** Per-match stat keys shared by the lineup schema, editor UI, and server merge. */
export const LINEUP_STAT_KEYS = [
  "goals",
  "assists",
  "cleanSheets",
  "yellowCards",
  "redCards",
  "motm",
  "saves",
] as const;
export type LineupStatKey = (typeof LINEUP_STAT_KEYS)[number];
