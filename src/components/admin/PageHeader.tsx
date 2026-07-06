import type { ReactNode } from "react";

/**
 * PageHeader — consistent screen header (eyebrow + title + optional count and
 * right-aligned actions). Mobile-first: title stacks above actions on small
 * screens, sits inline from `sm`. (admin-ux-spec §3.1 eyebrow / §4 headers)
 *
 * Wave 4 usage:
 *   <PageHeader eyebrow="Manage" title="Players" count={players.length}
 *     actions={<Button>+ Player</Button>} />
 */
type PageHeaderProps = Readonly<{
  title: string;
  eyebrow?: string;
  count?: number;
  description?: string;
  actions?: ReactNode;
}>;

export function PageHeader({
  title,
  eyebrow,
  count,
  description,
  actions,
}: PageHeaderProps) {
  return (
    <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex flex-col gap-1">
        {eyebrow ? (
          <p className="text-[10px] uppercase tracking-[0.24em] text-white/50">
            {eyebrow}
          </p>
        ) : null}
        <div className="flex items-baseline gap-2">
          <h1 className="text-xl font-semibold tracking-tight text-white">
            {title}
          </h1>
          {typeof count === "number" ? (
            <span className="font-mono text-sm text-white/50">· {count}</span>
          ) : null}
        </div>
        {description ? (
          <p className="text-sm text-white/60">{description}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 items-center gap-2">{actions}</div>
      ) : null}
    </header>
  );
}
