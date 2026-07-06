"use client";

import { useState } from "react";
import { HelpCircle } from "lucide-react";

import { getHelpEntry, type FeatureKey } from "@/content/help";

import { HelpSheet } from "./HelpSheet";

type HelpButtonProps = Readonly<{
  featureKey: FeatureKey;
}>;

/**
 * ปุ่ม `?` กลม glass (≥44px) ใน PageHeader — เปิด HelpSheet ของฟีเจอร์นั้น
 * (contextual help ชั้น 1 ตาม spec §4)
 */
export function HelpButton({ featureKey }: HelpButtonProps) {
  const [open, setOpen] = useState(false);
  const entry = getHelpEntry(featureKey);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`ช่วยเหลือ: ${entry.title}`}
        className="grid size-11 shrink-0 place-items-center rounded-full border border-white/10 bg-white/5 text-white/70 backdrop-blur-xl transition outline-none hover:border-white/30 hover:text-white focus-visible:ring-2 focus-visible:ring-sky-400/70"
      >
        <HelpCircle className="size-5" aria-hidden="true" />
      </button>
      <HelpSheet entry={entry} open={open} onOpenChange={setOpen} />
    </>
  );
}
