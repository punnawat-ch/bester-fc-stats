"use client";

import { Toaster as SonnerToaster, type ToasterProps } from "sonner";

/**
 * Toaster — Sonner, dark-only, themed to admin tones (admin-ux-spec §3.3 / §5).
 * success=emerald, error=rose, info=blue. Mounted once in the admin shell so
 * Wave 4 pages can call `toast.success(...)` / `toast.error(...)`.
 *
 * Position: bottom-center on mobile (above the tab bar), top-right on desktop
 * is handled by callers when needed; default here is bottom-center.
 */
function Toaster(props: ToasterProps) {
  return (
    <SonnerToaster
      theme="dark"
      position="bottom-center"
      offset={88}
      toastOptions={{
        classNames: {
          toast:
            "group rounded-2xl border border-border bg-panel-2/95 text-fg shadow-panel ring-1 ring-border backdrop-blur-2xl",
          description: "text-fg-muted",
          actionButton: "rounded-xl bg-primary/90 text-primary-foreground",
          cancelButton: "rounded-xl bg-glass text-fg",
          success: "text-success-fg",
          error: "text-danger-fg",
          info: "text-info-fg",
        },
      }}
      style={
        {
          "--normal-bg": "#0b1224",
          "--normal-text": "#ffffff",
          "--normal-border": "rgba(255,255,255,0.1)",
        } as React.CSSProperties
      }
      {...props}
    />
  );
}

export { Toaster };
