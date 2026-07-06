import { cn } from "@/lib/utils";

/** Skeleton — pulse placeholder; use the same shape as the real card/row. */
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("animate-pulse rounded-2xl bg-white/5", className)}
      {...props}
    />
  );
}

export { Skeleton };
