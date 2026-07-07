import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * Badge — pill, re-themed to StatBadge tones (admin-ux-spec §3.2).
 * success=emerald, info=blue, danger=rose, neutral=glass.
 */
const badgeVariants = cva(
  "inline-flex w-fit items-center justify-center gap-1 rounded-full border px-3 py-1 text-[10px] font-medium uppercase tracking-[0.24em] ring-1 [&>svg]:size-3",
  {
    variants: {
      variant: {
        neutral: "border-glass-strong bg-glass text-fg ring-glass-strong",
        success:
          "border-success/30 bg-success/15 text-success-fg ring-success/30",
        info: "border-info/30 bg-info/15 text-info-fg ring-info/30",
        danger:
          "border-danger/30 bg-danger/15 text-danger-fg ring-danger/30",
      },
    },
    defaultVariants: {
      variant: "neutral",
    },
  },
);

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span";
  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
