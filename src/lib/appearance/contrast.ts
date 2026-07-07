/**
 * WCAG relative-luminance / contrast helpers used to auto-pick a legible
 * foreground ink for a chosen brand color (docs/theme-appearance-phase2-spec.md §3).
 * Hand-rolled — no dependency needed.
 */

/** Near-black ink used across the dark stadium theme (= --color-fg-inverse). */
export const INK = "#08110c";

function linearizeChannel(value8bit: number): number {
  const s = value8bit / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

export function relativeLuminance(hex: string): number {
  const n = hex.replace("#", "");
  const r = Number.parseInt(n.slice(0, 2), 16);
  const g = Number.parseInt(n.slice(2, 4), 16);
  const b = Number.parseInt(n.slice(4, 6), 16);
  return (
    0.2126 * linearizeChannel(r) +
    0.7152 * linearizeChannel(g) +
    0.0722 * linearizeChannel(b)
  );
}

export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const hi = Math.max(la, lb);
  const lo = Math.min(la, lb);
  return (hi + 0.05) / (lo + 0.05);
}

/** Pick white or the dark ink — whichever reads better on the brand fill. */
export function pickForeground(brandHex: string): string {
  return contrastRatio(brandHex, "#ffffff") >= contrastRatio(brandHex, INK)
    ? "#ffffff"
    : INK;
}
