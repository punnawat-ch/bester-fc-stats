"use client";

import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

/**
 * ConfirmSheet — destructive-action confirm as a mobile bottom-sheet
 * (admin-ux-spec §5 "Confirm sheets"). Controlled; the danger button is NOT the
 * default focus. Use for deletes / deactivate.
 *
 * Wave 4 usage:
 *   const [open, setOpen] = useState(false);
 *   <ConfirmSheet
 *     open={open} onOpenChange={setOpen}
 *     title="Delete Somchai P.?"
 *     description="This action cannot be undone."
 *     confirmLabel="Delete player"
 *     pending={isDeleting}
 *     onConfirm={() => startTransition(deletePlayer)}
 *   />
 */
type ConfirmSheetProps = Readonly<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  pending?: boolean;
  onConfirm: () => void;
}>;

export function ConfirmSheet({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  pending = false,
  onConfirm,
}: ConfirmSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" role="alertdialog">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          {description ? (
            <SheetDescription>{description}</SheetDescription>
          ) : null}
        </SheetHeader>
        <SheetFooter>
          <Button
            type="button"
            variant="destructive"
            size="lg"
            disabled={pending}
            aria-busy={pending}
            onClick={onConfirm}
          >
            {pending ? "Working…" : confirmLabel}
          </Button>
          <SheetClose asChild>
            <Button type="button" variant="secondary" disabled={pending}>
              {cancelLabel}
            </Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
