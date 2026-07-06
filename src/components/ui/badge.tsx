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
        neutral: "border-white/15 bg-white/5 text-white ring-white/15",
        success:
          "border-emerald-400/30 bg-emerald-500/15 text-emerald-200 ring-emerald-400/30",
        info: "border-blue-400/30 bg-blue-500/15 text-blue-100 ring-blue-400/30",
        danger:
          "border-rose-400/30 bg-rose-500/15 text-rose-200 ring-rose-400/30",
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
