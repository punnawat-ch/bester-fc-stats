"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireUser } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { pickForeground } from "@/lib/appearance/contrast";
import { PREVIEW_COOKIE } from "@/lib/appearance/service";

/**
 * Server actions for the appearance/brand theming screen
 * (docs/theme-appearance-phase2-spec.md §5-6). All guarded by `club:edit`.
 * Revisions are append-only; publish flips the active pointer + archives the
 * previous published one; revert clones an old revision into a fresh draft.
 */
export type ActionResult =
  | { ok: true; id?: string }
  | { ok: false; error: ActionError };

type ActionError =
  | "INVALID_INPUT"
  | "CLUB_NOT_FOUND"
  | "REVISION_NOT_FOUND"
  | "NOT_A_DRAFT"
  | "SAVE_FAILED";

const draftInputSchema = z.object({
  brand: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  label: z.string().trim().max(60).optional(),
  note: z.string().trim().max(280).optional(),
});

function previewCookieOptions() {
  return { httpOnly: true, sameSite: "lax", path: "/" } as const;
}

/** Save the current brand as a new DRAFT revision (no public effect). */
export async function saveDraft(input: unknown): Promise<ActionResult> {
  const session = await requireUser("club:edit");

  const parsed = draftInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "INVALID_INPUT" };
  }
  const { brand, label, note } = parsed.data;

  const club = await prisma.club.findFirst({ select: { id: true } });
  if (!club) {
    return { ok: false, error: "CLUB_NOT_FOUND" };
  }

  try {
    const draft = await prisma.appearanceRevision.create({
      data: {
        clubId: club.id,
        status: "DRAFT",
        tokens: { brand, brandForeground: pickForeground(brand) },
        label: label && label.length > 0 ? label : null,
        note: note && note.length > 0 ? note : null,
        createdById: session.user.id,
      },
      select: { id: true },
    });
    revalidatePath("/admin/appearance");
    return { ok: true, id: draft.id };
  } catch {
    return { ok: false, error: "SAVE_FAILED" };
  }
}

/** Publish a revision: archive the current published one, flip the active pointer. */
export async function publishRevision(id: string): Promise<ActionResult> {
  await requireUser("club:edit");

  try {
    await prisma.$transaction(async (tx) => {
      const club = await tx.club.findFirstOrThrow({ select: { id: true } });
      const revision = await tx.appearanceRevision.findUnique({
        where: { id },
        select: { id: true, clubId: true, tokens: true },
      });
      if (!revision || revision.clubId !== club.id) {
        throw new Error("REVISION_NOT_FOUND");
      }

      await tx.appearanceRevision.updateMany({
        where: { clubId: club.id, status: "PUBLISHED" },
        data: { status: "ARCHIVED" },
      });
      await tx.appearanceRevision.update({
        where: { id },
        data: { status: "PUBLISHED", publishedAt: new Date() },
      });

      const brand = readBrand(revision.tokens);
      await tx.club.update({
        where: { id: club.id },
        data: { activeAppearanceId: id, themeColor: brand ?? undefined },
      });
    });
  } catch (error) {
    if (error instanceof Error && error.message === "REVISION_NOT_FOUND") {
      return { ok: false, error: "REVISION_NOT_FOUND" };
    }
    return { ok: false, error: "SAVE_FAILED" };
  }

  await clearPreviewCookie();
  revalidatePath("/", "layout");
  revalidatePath("/admin/appearance");
  return { ok: true };
}

/** Clone any revision into a new DRAFT (audit-friendly revert). Returns draft id. */
export async function revertToRevision(id: string): Promise<ActionResult> {
  const session = await requireUser("club:edit");

  const source = await prisma.appearanceRevision.findUnique({
    where: { id },
    select: { clubId: true, tokens: true, label: true },
  });
  if (!source) {
    return { ok: false, error: "REVISION_NOT_FOUND" };
  }

  try {
    const draft = await prisma.appearanceRevision.create({
      data: {
        clubId: source.clubId,
        status: "DRAFT",
        tokens: source.tokens ?? {},
        label: source.label ? `${source.label} (restored)` : "Restored",
        createdById: session.user.id,
      },
      select: { id: true },
    });
    revalidatePath("/admin/appearance");
    return { ok: true, id: draft.id };
  } catch {
    return { ok: false, error: "SAVE_FAILED" };
  }
}

/** Delete a DRAFT (never a published/archived revision). */
export async function deleteDraft(id: string): Promise<ActionResult> {
  await requireUser("club:edit");

  const revision = await prisma.appearanceRevision.findUnique({
    where: { id },
    select: { status: true },
  });
  if (!revision) {
    return { ok: false, error: "REVISION_NOT_FOUND" };
  }
  if (revision.status !== "DRAFT") {
    return { ok: false, error: "NOT_A_DRAFT" };
  }

  await prisma.appearanceRevision.delete({ where: { id } });
  await clearPreviewCookieIf(id);
  revalidatePath("/admin/appearance");
  return { ok: true };
}

/** Preview a draft across the whole site for this admin (sets the cookie). */
export async function setPreview(id: string): Promise<ActionResult> {
  await requireUser("club:edit");
  const store = await cookies();
  store.set(PREVIEW_COOKIE, id, previewCookieOptions());
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function clearPreview(): Promise<ActionResult> {
  await requireUser("club:edit");
  await clearPreviewCookie();
  revalidatePath("/", "layout");
  return { ok: true };
}

async function clearPreviewCookie() {
  const store = await cookies();
  store.delete(PREVIEW_COOKIE);
}

async function clearPreviewCookieIf(id: string) {
  const store = await cookies();
  if (store.get(PREVIEW_COOKIE)?.value === id) {
    store.delete(PREVIEW_COOKIE);
  }
}

function readBrand(tokens: unknown): string | undefined {
  if (tokens && typeof tokens === "object" && "brand" in tokens) {
    const brand = (tokens as { brand?: unknown }).brand;
    return typeof brand === "string" ? brand : undefined;
  }
  return undefined;
}
