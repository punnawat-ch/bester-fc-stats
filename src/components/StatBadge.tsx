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
    "bg-white/5 text-white ring-white/15 from-white/5 to-transparent",
  success:
    "bg-emerald-500/15 text-emerald-200 ring-emerald-400/30 from-emerald-500/20 to-transparent",
  warning:
    "bg-blue-500/15 text-blue-100 ring-blue-400/30 from-blue-500/20 to-transparent",
  danger:
    "bg-rose-500/15 text-rose-200 ring-rose-400/30 from-rose-500/20 to-transparent",
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
      className={`glass-panel w-full flex flex-col gap-1 rounded-2xl border border-white/10 bg-gradient-to-br ring-1 ${toneStyles[tone]} ${sizeStyles[size]}`}
    >
      <span className="text-xs uppercase tracking-[0.2em] text-white/60">
        {label}
      </span>
      <span
        className={`${size === "sm" ? "text-lg" : "text-2xl"} font-semibold text-white`}
      >
        {value}
      </span>
    </div>
  );
}

