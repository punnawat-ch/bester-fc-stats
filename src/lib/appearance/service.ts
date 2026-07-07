import "server-only";
import { cookies } from "next/headers";
import { cache } from "react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { can } from "@/lib/rbac";
import { DEFAULT_SEED, parseSeed, type AppearanceSeed } from "./schema";

/** Cookie an admin sets (via the settings UI) to preview a DRAFT before publishing. */
export const PREVIEW_COOKIE = "appearance_preview";

/**
 * Resolve the appearance seed to render this request (docs §4-5).
 * - Admins with an active preview cookie see that DRAFT (self only).
 * - Everyone else sees the club's PUBLISHED active appearance.
 * - Falls back to DEFAULT_SEED (matches globals.css :root) when unset/malformed.
 *
 * `cache` dedupes within a request; reading cookies/auth keeps it per-request dynamic.
 */
export const getActiveAppearance = cache(async (): Promise<AppearanceSeed> => {
  const preview = await getPreviewSeed();
  if (preview) {
    return preview;
  }
  const club = await prisma.club.findFirst({
    include: { activeAppearance: true },
  });
  return parseSeed(club?.activeAppearance?.tokens) ?? DEFAULT_SEED;
});

async function getPreviewSeed(): Promise<AppearanceSeed | null> {
  const store = await cookies();
  const previewId = store.get(PREVIEW_COOKIE)?.value;
  if (!previewId) {
    return null;
  }
  const session = await auth();
  if (!session?.user || !can(session.user.role, "club:edit")) {
    return null;
  }
  const revision = await prisma.appearanceRevision.findUnique({
    where: { id: previewId },
  });
  return parseSeed(revision?.tokens);
}
