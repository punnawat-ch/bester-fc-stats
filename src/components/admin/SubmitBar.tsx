import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";

/**
 * SubmitBar — sticky bottom action bar for forms/sheets (admin-ux-spec §3.3
 * "Sticky action bar" / §5 "Form save bar"). Full-width Save + optional Cancel,
 * safe-area padding, glass background. Disable Save until the form is dirty &
 * valid; show a spinner label while pending.
 *
 * Wave 4 usage:
 *   <SubmitBar
 *     pending={isSubmitting}
 *     disabled={!form.formState.isDirty}
 *     saveLabel="Save player"
 *     onCancel={close}
 *   />
 * Render inside the scroll container of a Sheet/Dialog form.
 */
type SubmitBarProps = Readonly<{
  saveLabel?: string;
  pendingLabel?: string;
  cancelLabel?: string;
  pending?: boolean;
  disabled?: boolean;
  onCancel?: () => void;
  /** Extra content rendered left of the buttons (e.g. a destructive action). */
  children?: ReactNode;
}>;

export function SubmitBar({
  saveLabel = "Save",
  pendingLabel = "Saving…",
  cancelLabel = "Cancel",
  pending = false,
  disabled = false,
  onCancel,
  children,
}: SubmitBarProps) {
  return (
    <div className="pb-safe sticky bottom-0 -mx-5 mt-2 border-t border-white/10 bg-[#0a1222]/95 px-5 pt-3 pb-3 backdrop-blur">
      <div className="flex items-center gap-2">
        {children}
        {onCancel ? (
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={pending}
          >
            {cancelLabel}
          </Button>
        ) : null}
        <Button
          type="submit"
          className="flex-1"
          size="lg"
          disabled={disabled || pending}
          aria-busy={pending}
        >
          {pending ? pendingLabel : saveLabel}
        </Button>
      </div>
    </div>
  );
}
