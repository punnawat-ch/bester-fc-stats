"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

import { DEFAULT_THEME_COLOR, clubSchema } from "./schema";

/**
 * Guarded server action for the Club / Branding / SEO screen
 * (migration-spec §5.1 pattern, admin-ux-spec §4.6).
 *
 * - `requireUser("club:edit")` first (ADMIN + EDITOR). Runs outside try/catch
 *   so an unauthenticated redirect is never swallowed.
 * - Zod-parses the input with the shared schema.
 * - Updates the single club row (its id is fetched first).
 * - `revalidatePath("/")` refreshes public metadata/branding + `/admin/club`.
 */
export type UpdateClubResult =
  | { ok: true }
  | { ok: false; error: UpdateClubError };

type UpdateClubError =
  | "INVALID_INPUT"
  | "CLUB_NOT_FOUND"
  | "SAVE_FAILED";

function toNullable(value: string): string | null {
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

function dedupeKeywords(keywords: readonly string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const keyword of keywords) {
    const trimmed = keyword.trim();
    if (trimmed !== "" && !seen.has(trimmed)) {
      seen.add(trimmed);
      result.push(trimmed);
    }
  }
  return result;
}

export async function updateClub(input: unknown): Promise<UpdateClubResult> {
  await requireUser("club:edit");

  const parsed = clubSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "INVALID_INPUT" };
  }
  const data = parsed.data;

  const club = await prisma.club.findFirst({ select: { id: true } });
  if (!club) {
    return { ok: false, error: "CLUB_NOT_FOUND" };
  }

  try {
    await prisma.club.update({
      where: { id: club.id },
      data: {
        name: data.name.trim(),
        shortName: data.shortName.trim(),
        crestUrl: toNullable(data.crestUrl),
        facebookUrl: toNullable(data.facebookUrl),
        instagramUrl: toNullable(data.instagramUrl),
        siteUrl: toNullable(data.siteUrl),
        seoTitle: toNullable(data.seoTitle),
        seoDescription: toNullable(data.seoDescription),
        seoKeywords: dedupeKeywords(data.seoKeywords),
        ogImageUrl: toNullable(data.ogImageUrl),
        themeColor: toNullable(data.themeColor) ?? DEFAULT_THEME_COLOR,
      },
    });
  } catch {
    return { ok: false, error: "SAVE_FAILED" };
  }

  revalidatePath("/");
  revalidatePath("/admin/club");
  return { ok: true };
}
