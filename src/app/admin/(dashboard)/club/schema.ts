import { z } from "zod";

/**
 * Club / Branding / SEO form schema (admin-ux-spec §4.6, migration-spec §2).
 *
 * Shared by the client resolver and the `updateClub` server action so both
 * validate identically. Optional URL fields accept an empty string (meaning
 * "clear this value"); the server action maps empty strings to `null` before
 * persisting. Input and output types are identical (no `.transform`/`.default`)
 * so React Hook Form value types stay simple.
 */

export const DEFAULT_THEME_COLOR = "#0b1124";

/** Soft length guidance surfaced as counters in the UI (not hard failures). */
export const SEO_TITLE_SOFT_MAX = 60;
export const SEO_DESCRIPTION_SOFT_MAX = 160;
export const MAX_KEYWORDS = 30;

const HEX_COLOR = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

function isEmptyOrHttpUrl(value: string): boolean {
  if (value === "") {
    return true;
  }
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

const optionalUrl = z
  .string()
  .trim()
  .max(2048, "URL is too long")
  .refine(isEmptyOrHttpUrl, {
    message: "Enter a valid http(s) URL or leave it empty",
  });

export const clubSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Club name is required")
    .max(120, "Club name is too long"),
  shortName: z
    .string()
    .trim()
    .min(1, "Short name is required")
    .max(60, "Short name is too long"),
  crestUrl: optionalUrl,
  facebookUrl: optionalUrl,
  instagramUrl: optionalUrl,
  siteUrl: optionalUrl,
  seoTitle: z.string().trim().max(160, "SEO title is too long"),
  seoDescription: z.string().trim().max(400, "SEO description is too long"),
  seoKeywords: z
    .array(z.string().trim().min(1))
    .max(MAX_KEYWORDS, `Use at most ${MAX_KEYWORDS} keywords`),
  ogImageUrl: optionalUrl,
  themeColor: z
    .string()
    .trim()
    .refine((value) => value === "" || HEX_COLOR.test(value), {
      message: "Use a hex color like #0b1124",
    }),
});

export type ClubFormValues = z.infer<typeof clubSchema>;
