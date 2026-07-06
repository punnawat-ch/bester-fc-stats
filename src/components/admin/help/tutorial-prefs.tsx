"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";

/** ค่า tutorial prefs ของผู้ใช้ปัจจุบัน (ส่งลงมาจาก admin layout) */
export type TutorialPrefs = {
  /** เปิด auto-tour ไหม */
  tutorialEnabled: boolean;
  /** featureKey ที่ผู้ใช้ดูจบแล้ว (กัน auto ซ้ำ) */
  toursSeen: readonly string[];
};

const DEFAULT_PREFS: TutorialPrefs = {
  tutorialEnabled: true,
  toursSeen: [],
};

const TutorialPrefsContext = createContext<TutorialPrefs>(DEFAULT_PREFS);

/**
 * ให้ค่า tutorial prefs แก่ client components (Wave 7.2 `useFeatureTour` จะ consume)
 * ค่าจริงถูกอ่านจาก DB ใน admin layout แล้วส่งลงมาเป็น props
 */
export function TutorialPrefsProvider({
  tutorialEnabled,
  toursSeen,
  children,
}: Readonly<{
  tutorialEnabled: boolean;
  toursSeen: readonly string[];
  children: ReactNode;
}>) {
  const value = useMemo<TutorialPrefs>(
    () => ({ tutorialEnabled, toursSeen }),
    [tutorialEnabled, toursSeen],
  );

  return (
    <TutorialPrefsContext.Provider value={value}>
      {children}
    </TutorialPrefsContext.Provider>
  );
}

/** อ่าน tutorial prefs ของผู้ใช้ปัจจุบัน */
export function useTutorialPrefs(): TutorialPrefs {
  return useContext(TutorialPrefsContext);
}
