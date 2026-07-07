"use client";

import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";

import { cn } from "@/lib/utils";

/** Label — bound to inputs for a11y (admin-ux-spec §6). */
function Label({
  className,
  ...props
}: React.ComponentProps<typeof LabelPrimitive.Root>) {
  return (
    <LabelPrimitive.Root
      data-slot="label"
      className={cn(
        "flex items-center gap-2 text-sm font-medium text-fg-muted select-none",
        "peer-disabled:cursor-not-allowed peer-disabled:opacity-60",
        className,
      )}
      {...props}
    />
  );
}

export { Label };
