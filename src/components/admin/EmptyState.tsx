import type { ReactNode } from "react";

/**
 * EmptyState — friendly zero-data state (icon + eyebrow + message + CTA).
 * Used wherever a list has no rows, e.g. the dashboard's "no upcoming
 * fixtures". (admin-ux-spec §3.3 Empty state)
 *
 * Wave 4 usage:
 *   <EmptyState icon={<CalendarIcon />} title="No fixtures yet"
 *     description="Add your first match to see it here."
 *     action={<Button>+ Add fixture</Button>} />
 */
type EmptyStateProps = Readonly<{
  title: string;
  description?: string;
  eyebrow?: string;
  icon?: ReactNode;
  action?: ReactNode;
}>;

export function EmptyState({
  title,
  description,
  eyebrow,
  icon,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-10 text-center">
      {icon ? (
        <div className="flex size-12 items-center justify-center rounded-full bg-white/5 text-white/50 [&_svg]:size-6">
          {icon}
        </div>
      ) : null}
      {eyebrow ? (
        <p className="text-[10px] uppercase tracking-[0.24em] text-white/50">
          {eyebrow}
        </p>
      ) : null}
      <div className="flex flex-col gap-1">
        <p className="text-base font-semibold text-white">{title}</p>
        {description ? (
          <p className="text-sm text-white/60">{description}</p>
        ) : null}
      </div>
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  );
}
