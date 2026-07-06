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
            "group rounded-2xl border border-white/10 bg-[#0b1224]/95 text-white shadow-[0_20px_50px_rgba(0,0,0,0.45)] ring-1 ring-white/10 backdrop-blur-2xl",
          description: "text-white/60",
          actionButton: "rounded-xl bg-sky-500/90 text-[#08110c]",
          cancelButton: "rounded-xl bg-white/5 text-white",
          success: "text-emerald-200",
          error: "text-rose-200",
          info: "text-blue-100",
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
