"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { BUCKETS, getPublicUrl, uploadObject } from "@/lib/supabase-storage";

import { DEFAULT_THEME_COLOR, clubSchema } from "./schema";

const MAX_UPLOAD_BYTES = 6 * 1024 * 1024;

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

/** Which club asset an upload targets (drives bucket folder + DB column). */
export type ClubAssetKind = "crest" | "og";

export type ClubAssetResult = Readonly<{
  ok: boolean;
  url?: string | null;
  error?: string;
}>;

/**
 * Uploads a processed crest / OG image through this Server Action (no client
 * storage key) into `club-assets` and persists its public URL onto the club.
 * No background removal — crest/OG only get resized/compressed client-side.
 * Guarded by `club:edit`.
 */
export async function saveClubAsset(
  kind: ClubAssetKind,
  formData: FormData,
): Promise<ClubAssetResult> {
  await requireUser("club:edit");

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "INVALID_INPUT" };
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return { ok: false, error: "FILE_TOO_LARGE" };
  }

  const club = await prisma.club.findFirst({ select: { id: true } });
  if (!club) {
    return { ok: false, error: "CLUB_NOT_FOUND" };
  }

  const folder = kind === "crest" ? "crest" : "og";
  const path = `${folder}/${randomUUID()}.png`;
  try {
    const bytes = new Uint8Array(await file.arrayBuffer());
    await uploadObject(BUCKETS.club, path, bytes, "image/png");
  } catch {
    return { ok: false, error: "UPLOAD_FAILED" };
  }

  const url = getPublicUrl(BUCKETS.club, path);
  const data = kind === "crest" ? { crestUrl: url } : { ogImageUrl: url };
  await prisma.club.update({ where: { id: club.id }, data });

  revalidatePath("/");
  revalidatePath("/admin/club");
  return { ok: true, url };
}
