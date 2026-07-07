type StatBadgeTone = "neutral" | "success" | "warning" | "danger";
type StatBadgeSize = "sm" | "md";

type StatBadgeProps = {
  label: string;
  value: number;
  tone?: StatBadgeTone;
  size?: StatBadgeSize;
};

const toneStyles: Record<StatBadgeTone, string> = {
  neutral:
    "bg-glass text-fg ring-border-strong from-glass to-transparent",
  success:
    "bg-success/15 text-success-fg ring-success/30 from-success/20 to-transparent",
  warning:
    "bg-warning/15 text-warning-fg ring-warning/30 from-warning/20 to-transparent",
  danger:
    "bg-danger/15 text-danger-fg ring-danger/30 from-danger/20 to-transparent",
};

const sizeStyles: Record<StatBadgeSize, string> = {
  sm: "px-3 py-2",
  md: "px-4 py-3",
};

// Server component: purely presentational and derived from static data.
export default function StatBadge({
  label,
  value,
  tone = "neutral",
  size = "md",
}: StatBadgeProps) {
  return (
    <div
      className={`glass-panel w-full flex flex-col gap-1 rounded-2xl border border-border bg-gradient-to-br ring-1 ${toneStyles[tone]} ${sizeStyles[size]}`}
    >
      <span className="text-xs uppercase tracking-[0.2em] text-fg-muted">
        {label}
      </span>
      <span
        className={`${size === "sm" ? "text-lg" : "text-2xl"} font-semibold text-fg`}
      >
        {value}
      </span>
    </div>
  );
}

