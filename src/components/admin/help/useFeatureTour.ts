"use client";

import { useEffect, useRef } from "react";

import { getHelpEntry, type FeatureKey } from "@/content/help";
import { markTourSeen } from "@/app/admin/(dashboard)/help/action";

import { startTour } from "./tour";
import { useTutorialPrefs } from "./tutorial-prefs";

/** หน่วงเล็กน้อยให้ DOM ของหน้า mount ครบก่อนเริ่มทัวร์ */
const TOUR_START_DELAY_MS = 400;

/**
 * Auto-run ทัวร์ครั้งแรกของฟีเจอร์หนึ่ง (spec §5.1):
 * ถ้า tutorialEnabled และยังไม่เคยดู → รอ DOM แล้ว startTour + markTourSeen
 * กันรันซ้ำด้วย ref (ต่อการ mount ของหน้า)
 */
export function useFeatureTour(key: FeatureKey): void {
  const { tutorialEnabled, toursSeen } = useTutorialPrefs();
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current || !tutorialEnabled) {
      return;
    }
    const seen = new Set(toursSeen);
    if (seen.has(key)) {
      return;
    }

    hasRun.current = true;
    const timer = globalThis.setTimeout(() => {
      startTour(getHelpEntry(key).tour);
      markTourSeen(key).catch(() => {});
    }, TOUR_START_DELAY_MS);

    return () => {
      globalThis.clearTimeout(timer);
    };
  }, [key, tutorialEnabled, toursSeen]);
}
