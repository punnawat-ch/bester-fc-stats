import type { ReactNode } from "react";

/**
 * ResponsiveList — the "table → card" responsive pattern (admin-ux-spec §3.4).
 * ONE data source rendered two ways: a stacked card list on mobile (`<md`) and
 * a real `<table>` from `md+`. Never horizontally-scroll a table on mobile.
 *
 * Wave 4 usage (Players / Users / Match history):
 *   <ResponsiveList
 *     items={players}
 *     getKey={(p) => p.id}
 *     empty={<EmptyState title="No players yet" />}
 *     renderCard={(p) => <PlayerCard player={p} />}
 *     head={<><th>Name</th><th>Goals</th><th className="text-right">Actions</th></>}
 *     renderRow={(p) => <PlayerRow player={p} />}   // returns the <td> cells
 *   />
 *
 * `renderRow` returns the row's `<td>` cells; ResponsiveList wraps them in a
 * styled `<tr>`. `head` returns the `<th>` cells for the sticky header.
 */
type ResponsiveListProps<T> = Readonly<{
  items: readonly T[];
  getKey: (item: T) => string;
  renderCard: (item: T) => ReactNode;
  head: ReactNode;
  renderRow: (item: T) => ReactNode;
  empty?: ReactNode;
}>;

export function ResponsiveList<T>({
  items,
  getKey,
  renderCard,
  head,
  renderRow,
  empty,
}: ResponsiveListProps<T>) {
  if (items.length === 0) {
    return empty ?? null;
  }

  return (
    <>
      {/* Mobile: card list */}
      <div className="flex flex-col gap-3 md:hidden">
        {items.map((item) => (
          <div key={getKey(item)}>{renderCard(item)}</div>
        ))}
      </div>

      {/* md+: real table */}
      <div className="hidden overflow-hidden rounded-2xl border border-border ring-1 ring-border md:block">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="sticky top-0 bg-panel-2/80 text-[10px] uppercase tracking-[0.2em] text-fg-subtle backdrop-blur [&_th]:px-4 [&_th]:py-3 [&_th]:font-medium">
            <tr>{head}</tr>
          </thead>
          <tbody className="[&_td]:px-4 [&_td]:py-3 [&_tr]:border-t [&_tr]:border-border [&_tr:hover]:bg-glass-xs">
            {items.map((item) => (
              <tr key={getKey(item)}>{renderRow(item)}</tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
