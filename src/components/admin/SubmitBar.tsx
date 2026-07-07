import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";

/**
 * SubmitBar — form action bar (admin-ux-spec §3.3 / §5). Balanced Cancel + Save
 * (Save 2× wider), safe-area aware. Disable Save until valid; spinner while pending.
 *
 * Two layouts via `variant` — the consumer decides based on its container:
 *  - `"sheet"` (default): full-bleed **sticky** bar for a Sheet/Dialog whose
 *    content has `p-5`. Uses `-mx-5 -mb-5` to break out of that padding so the
 *    bar spans edge-to-edge and sits flush at the very bottom (no gap / content
 *    peeking below). Solid bg so scrolling content stays hidden behind it.
 *      <SubmitBar pending={isSubmitting} disabled={!isValid} onCancel={close} />
 *  - `"page"`: inline bar at the end of a full page form (e.g. /admin/club).
 *    No negative margins (page padding ≠ 20px) and NOT sticky — a sticky bar on
 *    a page would overlap the fixed mobile bottom-nav. Just a top divider.
 *      <SubmitBar variant="page" pending={isSubmitting} disabled={!isDirty} />
 * Render as the last child of the form.
 */
type SubmitBarVariant = "sheet" | "page";

type SubmitBarProps = Readonly<{
  saveLabel?: string;
  pendingLabel?: string;
  cancelLabel?: string;
  pending?: boolean;
  disabled?: boolean;
  onCancel?: () => void;
  variant?: SubmitBarVariant;
  /** Extra content rendered left of the buttons (e.g. a destructive action). */
  children?: ReactNode;
}>;

const CONTAINER_CLASS: Record<SubmitBarVariant, string> = {
  sheet:
    "pb-safe sticky bottom-0 -mx-5 -mb-5 border-t border-border bg-panel px-5 pt-3 pb-4 shadow-[0_-10px_28px_rgba(0,0,0,0.55)]",
  page: "mt-4 border-t border-border pt-4",
};

export function SubmitBar({
  saveLabel = "Save",
  pendingLabel = "Saving…",
  cancelLabel = "Cancel",
  pending = false,
  disabled = false,
  onCancel,
  variant = "sheet",
  children,
}: SubmitBarProps) {
  return (
    <div className={CONTAINER_CLASS[variant]}>
      <div className="flex items-center gap-2.5">
        {children}
        {onCancel ? (
          <Button
            type="button"
            variant="secondary"
            size="lg"
            className="flex-1"
            onClick={onCancel}
            disabled={pending}
          >
            {cancelLabel}
          </Button>
        ) : null}
        <Button
          type="submit"
          className="flex-[2]"
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
