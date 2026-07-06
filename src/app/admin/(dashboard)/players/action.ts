"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";

import { requireUser } from "@/lib/auth-guard";
import { getClub } from "@/lib/football";
import { prisma } from "@/lib/prisma";
import { upsertPlayerSchema } from "./schema";

/**
 * Typed result returned by every Players mutation. `error` is a stable machine
 * code (e.g. NAME_TAKEN) that the client maps to a human message + inline field
 * error. RBAC is enforced first via `requireUser("player:write")`, which throws
 * `ForbiddenError` for a VIEWER (defence-in-depth — the UI already hides these).
 */
export type ActionResult = Readonly<{ ok: boolean; error?: string }>;

function isUniqueViolation(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

export async function upsertPlayer(input: unknown): Promise<ActionResult> {
  await requireUser("player:write");

  const parsed = upsertPlayerSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "INVALID_INPUT" };
  }

  const { id, ...data } = parsed.data;
  const club = await getClub();

  try {
    if (id) {
      // updateMany lets us scope the write to the club (id + clubId filter).
      const result = await prisma.player.updateMany({
        where: { id, clubId: club.id },
        data,
      });
      if (result.count === 0) {
        return { ok: false, error: "NOT_FOUND" };
      }
    } else {
      await prisma.player.create({ data: { ...data, clubId: club.id } });
    }
  } catch (error) {
    if (isUniqueViolation(error)) {
      return { ok: false, error: "NAME_TAKEN" };
    }
    return { ok: false, error: "UNKNOWN" };
  }

  revalidatePath("/");
  revalidatePath("/admin/players");
  return { ok: true };
}

export async function deletePlayer(id: string): Promise<ActionResult> {
  await requireUser("player:write");

  if (!id) {
    return { ok: false, error: "INVALID_INPUT" };
  }

  const club = await getClub();
  const result = await prisma.player.deleteMany({
    where: { id, clubId: club.id },
  });
  if (result.count === 0) {
    return { ok: false, error: "NOT_FOUND" };
  }

  revalidatePath("/");
  revalidatePath("/admin/players");
  return { ok: true };
}
