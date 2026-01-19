"use client";

import type { ReactNode } from "react";

type HighlightRowProps = {
  isHighlighted: boolean;
  children: ReactNode;
};

// Client component: used by the interactive leaderboard to reflect UI state.
export default function HighlightRow({
  isHighlighted,
  children,
}: HighlightRowProps) {
  return (
    <tr
      className={`transition-colors ${
        isHighlighted ? "bg-emerald-400/10" : "bg-transparent"
      }`}
    >
      {children}
    </tr>
  );
}

