"use client";

import Link from "next/link";
import { BookOpen, Play } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { markTourSeen } from "@/app/admin/(dashboard)/help/action";
import type { HelpEntry } from "@/content/help";

import { startTour } from "./tour";

type HelpSheetProps = Readonly<{
  entry: HelpEntry;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}>;

/** เปิดทัวร์หลังปิด sheet ให้ overlay ของ sheet หายไปก่อน */
const TOUR_AFTER_CLOSE_MS = 220;

/**
 * HelpSheet (ชั้น 1 contextual help) — bottom sheet แสดงสรุปฟีเจอร์ + 2 ปุ่ม:
 * ดูวิธีใช้ (เริ่มทัวร์ highlight-only) และเปิดคู่มือเต็มใน Help hub
 */
export function HelpSheet({ entry, open, onOpenChange }: HelpSheetProps) {
  const hasTour = entry.tour.length > 0;

  function handleTour() {
    onOpenChange(false);
    globalThis.setTimeout(() => {
      startTour(entry.tour);
    }, TOUR_AFTER_CLOSE_MS);
    markTourSeen(entry.key).catch(() => {});
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[80dvh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{entry.title}</SheetTitle>
          <SheetDescription asChild>
            <div className="text-sm leading-relaxed text-fg-muted [&_b]:font-semibold [&_b]:text-fg">
              {entry.summary}
            </div>
          </SheetDescription>
        </SheetHeader>

        <div className="mt-2 flex flex-col gap-2">
          {hasTour ? (
            <Button type="button" onClick={handleTour}>
              <Play className="size-4" aria-hidden="true" />
              ดูวิธีใช้
            </Button>
          ) : null}
          <Button asChild variant="secondary">
            <Link href={`/admin/help#${entry.key}`} onClick={() => onOpenChange(false)}>
              <BookOpen className="size-4" aria-hidden="true" />
              เปิดคู่มือเต็ม
            </Link>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
