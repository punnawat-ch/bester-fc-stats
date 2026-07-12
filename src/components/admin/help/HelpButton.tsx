"use client";

import { useState } from "react";
import { HelpCircle } from "lucide-react";

import { getHelpEntry, type FeatureKey } from "@/content/help";
import { cn } from "@/lib/utils";

import { HelpSheet } from "./HelpSheet";

type HelpButtonProps = Readonly<{
  featureKey: FeatureKey;
  /** Override styling/positioning (e.g. to sit next to a dialog close button). */
  className?: string;
}>;

/**
 * ปุ่ม `?` กลม glass (≥44px) ใน PageHeader — เปิด HelpSheet ของฟีเจอร์นั้น
 * (contextual help ชั้น 1 ตาม spec §4). ส่ง `className` เพื่อปรับขนาด/ตำแหน่งได้
 * เช่น วางชิดปุ่มปิดใน dialog.
 */
export function HelpButton({ featureKey, className }: HelpButtonProps) {
  const [open, setOpen] = useState(false);
  const entry = getHelpEntry(featureKey);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`ช่วยเหลือ: ${entry.title}`}
        className={cn(
          "grid size-11 shrink-0 place-items-center rounded-full border border-border bg-glass text-fg-muted backdrop-blur-xl transition outline-none hover:border-border-hover hover:text-fg focus-visible:ring-2 focus-visible:ring-ring/70",
          className,
        )}
      >
        <HelpCircle className="size-5" aria-hidden="true" />
      </button>
      <HelpSheet entry={entry} open={open} onOpenChange={setOpen} />
    </>
  );
}
