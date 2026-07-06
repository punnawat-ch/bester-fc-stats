"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";

import { requireUser } from "@/lib/auth-guard";
import { getClub } from "@/lib/football";
import { prisma } from "@/lib/prisma";
import {
  BUCKETS,
  getPublicUrl,
  removeObject,
  uploadObject,
} from "@/lib/supabase-storage";
import { upsertPlayerSchema } from "./schema";

const MAX_UPLOAD_BYTES = 6 * 1024 * 1024;

function revalidatePlayers() {
  revalidatePath("/");
  revalidatePath("/admin/players");
}

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

  const { id, nickname, position, ...rest } = parsed.data;
  const club = await getClub();
  const data = {
    ...rest,
    nickname: nickname.trim() === "" ? null : nickname.trim(),
    position: position === "" ? null : position,
  };

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

  revalidatePlayers();
  return { ok: true };
}

/** Result of a photo upload / delete: on success `url` is the new public URL. */
export type PhotoResult = Readonly<{
  ok: boolean;
  url?: string | null;
  error?: string;
}>;

/**
 * Uploads a processed (cut-out, compressed) player photo through this Server
 * Action — the client never touches the Supabase service key. Stores it at
 * `players/{playerId}/{uuid}.png`, swaps `imagePath`/`imageUrl`, and best-effort
 * removes the previous object. Guarded by `player:write`.
 */
export async function savePlayerPhoto(
  playerId: string,
  formData: FormData,
): Promise<PhotoResult> {
  await requireUser("player:write");

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "INVALID_INPUT" };
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return { ok: false, error: "FILE_TOO_LARGE" };
  }

  const club = await getClub();
  const player = await prisma.player.findFirst({
    where: { id: playerId, clubId: club.id },
    select: { id: true, imagePath: true },
  });
  if (!player) {
    return { ok: false, error: "NOT_FOUND" };
  }

  const path = `players/${playerId}/${randomUUID()}.png`;
  try {
    const bytes = new Uint8Array(await file.arrayBuffer());
    await uploadObject(BUCKETS.players, path, bytes, "image/png");
  } catch {
    return { ok: false, error: "UPLOAD_FAILED" };
  }

  const url = getPublicUrl(BUCKETS.players, path);
  await prisma.player.update({
    where: { id: playerId },
    data: { imagePath: path, imageUrl: url },
  });

  if (player.imagePath && player.imagePath !== path) {
    await removeObject(BUCKETS.players, player.imagePath).catch(() => {});
  }

  revalidatePlayers();
  return { ok: true, url };
}

/** Removes a player's photo (storage object + DB fields). Guarded. */
export async function deletePlayerPhoto(playerId: string): Promise<PhotoResult> {
  await requireUser("player:write");

  const club = await getClub();
  const player = await prisma.player.findFirst({
    where: { id: playerId, clubId: club.id },
    select: { imagePath: true },
  });
  if (!player) {
    return { ok: false, error: "NOT_FOUND" };
  }

  if (player.imagePath) {
    await removeObject(BUCKETS.players, player.imagePath).catch(() => {});
  }
  await prisma.player.update({
    where: { id: playerId },
    data: { imagePath: null, imageUrl: null },
  });

  revalidatePlayers();
  return { ok: true, url: null };
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
