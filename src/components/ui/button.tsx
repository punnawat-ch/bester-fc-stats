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
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-semibold transition outline-none focus-visible:ring-2 focus-visible:ring-sky-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#08110c] disabled:pointer-events-none disabled:opacity-60 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-sky-500/90 text-[#08110c] shadow-[0_12px_30px_rgba(0,0,0,0.35)] hover:bg-sky-400",
        secondary:
          "border border-white/10 bg-white/5 text-white hover:border-white/30",
        destructive:
          "border border-rose-400/30 bg-rose-500/15 text-rose-200 hover:bg-rose-500/25",
        outline:
          "border border-white/10 bg-transparent text-white hover:bg-white/5",
        ghost: "text-white hover:bg-white/5",
        link: "text-sky-300 underline-offset-4 hover:underline",
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
