import { z } from "zod";

/**
 * The brand seed persisted per AppearanceRevision (docs/theme-appearance-phase2-spec.md §2).
 * Only overridable values are stored — derived state variants (hover/active/subtle) are
 * computed in CSS via color-mix, so they never live here.
 */
const hexColor = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, "must be a 6-digit hex color, e.g. #38bdf8");

export const appearanceSeedSchema = z.object({
  brand: hexColor,
  brandForeground: hexColor,
  radius: z.string().optional(),
});

export type AppearanceSeed = z.infer<typeof appearanceSeedSchema>;

/** Matches the :root defaults in globals.css (sky accent on near-black ink). */
export const DEFAULT_SEED: AppearanceSeed = {
  brand: "#38bdf8",
  brandForeground: "#08110c",
};

/** Parse a Prisma JSON `tokens` value into a seed, or null when malformed. */
export function parseSeed(input: unknown): AppearanceSeed | null {
  const result = appearanceSeedSchema.safeParse(input);
  return result.success ? result.data : null;
}
