import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Input — h-12, `text-base` (16px) to defeat iOS zoom (admin-ux-spec §3.3).
 * Use native `type` (date/time/number/tel/email) for the right mobile keyboard.
 */
function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-12 w-full rounded-2xl border border-white/10 bg-[#0b1224]/60 px-4 text-base text-white shadow-sm outline-none transition placeholder:text-white/40",
        "focus-visible:border-sky-400/60 focus-visible:ring-2 focus-visible:ring-sky-400/60",
        "aria-invalid:border-rose-400/60 aria-invalid:ring-2 aria-invalid:ring-rose-400/40",
        "disabled:cursor-not-allowed disabled:opacity-60",
        "file:border-0 file:bg-transparent file:text-sm file:font-medium",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
