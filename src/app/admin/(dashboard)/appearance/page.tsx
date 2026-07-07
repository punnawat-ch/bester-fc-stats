import type { Metadata } from "next";
import { cookies } from "next/headers";

import { requireUser } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/admin/PageHeader";
import { DEFAULT_SEED, parseSeed } from "@/lib/appearance/schema";
import { PREVIEW_COOKIE } from "@/lib/appearance/service";

import { AppearanceClient, type RevisionView } from "./appearance-client";

export const metadata: Metadata = {
  title: "Appearance",
  robots: { index: false, follow: false },
};

// Reads the preview cookie, so it must render per-request.
export const dynamic = "force-dynamic";

/**
 * Appearance / brand theming (docs/theme-appearance-phase2-spec.md).
 * Gated by `club:edit`. Lists revisions and lets an admin draft, preview,
 * publish, and revert the club's brand color.
 */
export default async function AppearancePage() {
  await requireUser("club:edit");

  const club = await prisma.club.findFirstOrThrow({
    select: {
      activeAppearanceId: true,
      appearances: {
        orderBy: { createdAt: "desc" },
        take: 50,
        select: {
          id: true,
          status: true,
          tokens: true,
          label: true,
          note: true,
          createdAt: true,
          publishedAt: true,
        },
      },
    },
  });

  const previewId = (await cookies()).get(PREVIEW_COOKIE)?.value ?? null;

  const revisions: RevisionView[] = club.appearances.map((revision) => {
    const seed = parseSeed(revision.tokens) ?? DEFAULT_SEED;
    return {
      id: revision.id,
      status: revision.status,
      brand: seed.brand,
      brandForeground: seed.brandForeground,
      label: revision.label,
      note: revision.note,
      createdAt: revision.createdAt.toISOString(),
      publishedAt: revision.publishedAt?.toISOString() ?? null,
      isActive: revision.id === club.activeAppearanceId,
    };
  });

  const activeBrand =
    revisions.find((revision) => revision.isActive)?.brand ?? DEFAULT_SEED.brand;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Settings"
        title="Appearance"
        description="Brand color for the whole site. Draft, preview, then publish."
      />
      <AppearanceClient
        revisions={revisions}
        activeBrand={activeBrand}
        previewId={previewId}
      />
    </div>
  );
}
