import { pickForeground } from "@/lib/appearance/contrast";
import type { AppearanceSeed } from "@/lib/appearance/schema";

/**
 * Curated starting themes (docs/theme-appearance-phase2-spec.md §7). Each is just
 * a brand accent — the dark stadium surfaces stay fixed. Admins pick one as a
 * draft and can then fine-tune the hex.
 */
export type AppearancePreset = Readonly<{
  key: string;
  label: string;
  brand: string;
}>;

export const APPEARANCE_PRESETS: readonly AppearancePreset[] = [
  { key: "stadium", label: "Stadium", brand: "#38bdf8" },
  { key: "ocean", label: "Ocean", brand: "#22d3ee" },
  { key: "sunset", label: "Sunset", brand: "#fb923c" },
  { key: "rose", label: "Rose", brand: "#fb7185" },
  { key: "forest", label: "Forest", brand: "#34d399" },
  { key: "violet", label: "Violet", brand: "#a78bfa" },
];

/** Build a full seed from a brand hex, auto-picking a legible foreground ink. */
export function seedFromBrand(brand: string): AppearanceSeed {
  return { brand, brandForeground: pickForeground(brand) };
}
