"use client";

import type { ReactNode } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import { useIsDesktop } from "./use-is-desktop";

type ResponsiveModalProps = Readonly<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  /** Hide the visible title but keep it for screen readers. */
  hideTitle?: boolean;
}>;

/**
 * ResponsiveModal — one overlay that is a full-height bottom-sheet on mobile
 * and a centered dialog from `md` (admin-ux-spec §4.5.5 / §7). Both share the
 * same body so the create/edit/detail forms are written once.
 */
export function ResponsiveModal({
  open,
  onOpenChange,
  title,
  description,
  children,
  hideTitle = false,
}: ResponsiveModalProps) {
  const isDesktop = useIsDesktop();

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto">
          <DialogHeader className={hideTitle ? "sr-only" : undefined}>
            <DialogTitle>{title}</DialogTitle>
            {description ? (
              <DialogDescription>{description}</DialogDescription>
            ) : null}
          </DialogHeader>
          {children}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="max-h-[92dvh] gap-3 overflow-y-auto"
      >
        <SheetHeader className={hideTitle ? "sr-only" : undefined}>
          <SheetTitle>{title}</SheetTitle>
          {description ? (
            <SheetDescription>{description}</SheetDescription>
          ) : null}
        </SheetHeader>
        {children}
      </SheetContent>
    </Sheet>
  );
}
