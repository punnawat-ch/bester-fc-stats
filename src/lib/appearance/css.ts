import type { CSSProperties } from "react";
import type { AppearanceSeed } from "./schema";

/**
 * Turn a brand seed into the inline CSS custom properties injected on <html>
 * (docs/theme-appearance-phase2-spec.md §4). These override the :root defaults
 * in globals.css; derived variants (hover/active/subtle/ring) cascade from --brand.
 * Values come from a Zod-validated seed, so they are safe to inline.
 */
export function appearanceToCssVars(seed: AppearanceSeed): CSSProperties {
  const vars: Record<string, string> = {
    "--brand": seed.brand,
    "--brand-foreground": seed.brandForeground,
    "--brand-ring": `color-mix(in srgb, ${seed.brand} 60%, transparent)`,
  };
  if (seed.radius) {
    vars["--radius-md"] = seed.radius;
  }
  return vars as CSSProperties;
}
