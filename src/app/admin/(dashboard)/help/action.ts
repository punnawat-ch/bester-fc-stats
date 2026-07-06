"use server";

import { requireUser } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import type { FeatureKey } from "@/content/help";

type ActionResult = { ok: boolean };

/** เปิด/ปิด auto-tutorial ของผู้ใช้ปัจจุบัน */
export async function setTutorialEnabled(enabled: boolean): Promise<ActionResult> {
  const session = await requireUser();
  await prisma.user.update({
    where: { id: session.user.id },
    data: { tutorialEnabled: enabled },
  });
  return { ok: true };
}

/** ทำเครื่องหมายว่าดูทัวร์ของฟีเจอร์นี้จบแล้ว (dedupe เข้า toursSeen) */
export async function markTourSeen(key: FeatureKey): Promise<ActionResult> {
  const session = await requireUser();
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { toursSeen: true },
  });
  if (!user) {
    return { ok: false };
  }

  const seen = new Set(user.toursSeen);
  if (seen.has(key)) {
    return { ok: true };
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { toursSeen: [...user.toursSeen, key] },
  });
  return { ok: true };
}

/** ลบ key ออกจาก toursSeen เพื่อให้ auto-tour ทำงานใหม่ */
export async function resetTour(key: FeatureKey): Promise<ActionResult> {
  const session = await requireUser();
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { toursSeen: true },
  });
  if (!user) {
    return { ok: false };
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { toursSeen: user.toursSeen.filter((entry) => entry !== key) },
  });
  return { ok: true };
}
