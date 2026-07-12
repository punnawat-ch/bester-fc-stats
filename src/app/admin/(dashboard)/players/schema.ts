import { z } from "zod";

/**
 * Zod schemas for the Players feature (admin-ux-spec §4.4 Validation).
 * - name: required, trimmed, unique per club (server maps P2002 → NAME_TAKEN).
 *
 * NOTE: the match-stat totals (matchesPlayed, goals, assists, …) are NO LONGER
 * edited here — they are a cached rollup auto-summed from each player's per-match
 * `MatchPlayer` rows (entered in the finish-match lineup). This form only edits a
 * player's identity/presentation fields.
 */
const nonNegativeInt = z
  .number({ message: "Enter a number" })
  .int("Must be a whole number")
  .min(0, "Must be 0 or more");

/** Card position enum — mirrors the Prisma `Position` enum (GK/DF/MF/FW). */
export const POSITIONS = ["GK", "DF", "MF", "FW"] as const;
export type PlayerPosition = (typeof POSITIONS)[number];

export const playerFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(80, "Name is too long"),
  nickname: z.string().trim().max(40, "Nickname is too long"),
  // "" means "no position" — the server action maps it to null.
  position: z.enum(POSITIONS).or(z.literal("")),
  // nullable: an empty jersey field clears the value rather than storing 0.
  jerseyNumber: z
    .number()
    .int("Must be a whole number")
    .min(0, "Must be 0 or more")
    .max(999, "Too large")
    .nullable(),
  sortOrder: nonNegativeInt,
});

export type PlayerFormValues = z.infer<typeof playerFormSchema>;

/** Server-action payload: form values plus an optional id (present when editing). */
export const upsertPlayerSchema = playerFormSchema.extend({
  id: z.string().min(1).optional(),
});

export type UpsertPlayerInput = z.infer<typeof upsertPlayerSchema>;
