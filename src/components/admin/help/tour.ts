"use client";

import { driver, type Config, type DriveStep, type PopoverDOM } from "driver.js";
import "driver.js/dist/driver.css";

import type { TourStep } from "@/content/help";

export type { TourStep };

/** ข้อความปุ่มภาษาไทยของทัวร์ */
const BUTTON_TEXT = {
  next: "ถัดไป",
  prev: "ก่อนหน้า",
  done: "จบ",
  close: "ข้าม",
} as const;

/** ใช้คลาสนี้ scope การ re-theme popover ใน globals.css */
const POPOVER_CLASS = "besterfc-tour";

/** ตรวจ prefers-reduced-motion เพื่อปิด animation ของ driver */
function prefersReducedMotion(): boolean {
  if (typeof globalThis.window === "undefined") {
    return false;
  }
  return globalThis.window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** เหลือเฉพาะสเต็ปที่ target มีอยู่จริงใน DOM (mobile-safe, กันทัวร์พัง) */
function toPresentDriveSteps(steps: readonly TourStep[]): DriveStep[] {
  if (typeof document === "undefined") {
    return [];
  }
  const present: DriveStep[] = [];
  for (const step of steps) {
    if (document.querySelector(step.selector)) {
      present.push({
        element: step.selector,
        popover: { title: step.title, description: step.description },
      });
    }
  }
  return present;
}

/** ตั้งข้อความปุ่ม "ข้าม" ให้ปุ่มปิด (driver ไม่มี option โดยตรง) */
function labelCloseButton(popover: PopoverDOM): void {
  popover.closeButton.innerText = BUTTON_TEXT.close;
}

/**
 * เริ่มทัวร์แบบ highlight-only จากรายการสเต็ป
 * - map `TourStep[]` → driver.js steps
 * - ปุ่มภาษาไทย, เคารพ reduced-motion, ข้ามสเต็ปที่ไม่มี target ใน DOM
 * เรียกได้จาก client เท่านั้น
 */
export function startTour(steps: readonly TourStep[]): void {
  const driveSteps = toPresentDriveSteps(steps);
  if (driveSteps.length === 0) {
    return;
  }

  const config: Config = {
    steps: driveSteps,
    animate: !prefersReducedMotion(),
    smoothScroll: true,
    allowClose: true,
    overlayColor: "#020617",
    overlayOpacity: 0.7,
    stagePadding: 6,
    stageRadius: 12,
    popoverClass: POPOVER_CLASS,
    showButtons: ["previous", "next", "close"],
    nextBtnText: BUTTON_TEXT.next,
    prevBtnText: BUTTON_TEXT.prev,
    doneBtnText: BUTTON_TEXT.done,
    onPopoverRender: (popover) => {
      labelCloseButton(popover);
    },
  };

  driver(config).drive();
}
