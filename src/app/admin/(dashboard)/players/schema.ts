import { z } from "zod";

/**
 * Zod schemas for the Players feature (admin-ux-spec §4.4 Validation).
 * - name: required, trimmed, unique per club (server maps P2002 → NAME_TAKEN).
 * - numeric stats: whole numbers ≥ 0.
 */
const nonNegativeInt = z
  .number({ message: "Enter a number" })
  .int("Must be a whole number")
  .min(0, "Must be 0 or more");

export const playerFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(80, "Name is too long"),
  matchesPlayed: nonNegativeInt,
  goals: nonNegativeInt,
  assists: nonNegativeInt,
  cleanSheets: nonNegativeInt,
  sortOrder: nonNegativeInt,
});

export type PlayerFormValues = z.infer<typeof playerFormSchema>;

/** Server-action payload: form values plus an optional id (present when editing). */
export const upsertPlayerSchema = playerFormSchema.extend({
  id: z.string().min(1).optional(),
});

export type UpsertPlayerInput = z.infer<typeof upsertPlayerSchema>;
