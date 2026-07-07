import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * Button — re-themed shadcn primitive.
 * Tones follow admin-ux-spec §3.3: primary=sky, destructive=rose, secondary=glass.
 * Sizes keep tap targets >=44px (default h-11, lg h-12) for mobile.
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-semibold transition outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:pointer-events-none disabled:opacity-60 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary/90 text-primary-foreground shadow-elevate-lg hover:bg-primary",
        secondary:
          "border border-border bg-glass text-fg hover:border-border-hover",
        destructive:
          "border border-danger/30 bg-danger/15 text-danger-fg hover:bg-danger/25",
        outline:
          "border border-border bg-transparent text-fg hover:bg-glass",
        ghost: "text-fg hover:bg-glass",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-4",
        sm: "h-10 rounded-xl px-3",
        lg: "h-12 px-6 text-base",
        icon: "size-11 rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
