import type { ReactNode } from "react";

import { welcomeHelp } from "./welcome";
import { dashboardHelp } from "./dashboard";
import { playersHelp } from "./players";
import { matchesHelp } from "./matches";
import { clubHelp } from "./club";
import { usersHelp } from "./users";

/** ฟีเจอร์ที่มีคู่มือ/ทัวร์ (English keys) */
export type FeatureKey =
  | "welcome"
  | "dashboard"
  | "players"
  | "matches"
  | "club"
  | "users";

/** สเต็ปทัวร์แบบ highlight-only — ชี้ element บนจอ + คำอธิบายภาษาไทย */
export type TourStep = {
  /** CSS selector ของเป้าหมาย เช่น '[data-tour="players-add"]' */
  selector: string;
  /** หัวข้อ (ไทย) */
  title: string;
  /** คำอธิบาย (ไทย) */
  description: string;
};

/** หัวข้อย่อยในคู่มือเต็ม (ใช้ใน Help hub) */
export type HelpSection = {
  heading: string;
  body: ReactNode;
};

/** เนื้อหาคู่มือ 1 ฟีเจอร์ — แหล่งเดียวใช้ทั้ง HelpSheet, hub และ tour */
export type HelpEntry = {
  key: FeatureKey;
  /** ชื่อฟีเจอร์ เช่น "จัดการผู้เล่น" */
  title: string;
  /** สรุปย่อ ใช้ใน HelpSheet */
  summary: ReactNode;
  /** คู่มือเต็ม ใช้ใน hub */
  sections: HelpSection[];
  /** สเต็ปทัวร์ highlight-only */
  tour: TourStep[];
};

/** Registry รวมคู่มือทุกฟีเจอร์ */
export const helpRegistry: Record<FeatureKey, HelpEntry> = {
  welcome: welcomeHelp,
  dashboard: dashboardHelp,
  players: playersHelp,
  matches: matchesHelp,
  club: clubHelp,
  users: usersHelp,
};

/** อ่านคู่มือของฟีเจอร์หนึ่ง (undefined ถ้าไม่มี) */
export function getHelpEntry(key: FeatureKey): HelpEntry {
  return helpRegistry[key];
}
