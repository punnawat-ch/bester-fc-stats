import type { MatchResult, MatchStatus } from "@prisma/client";

import { Badge } from "@/components/ui/badge";

/**
 * StatusChip — semantic status pill built on Badge (admin-ux-spec §3.2).
 * Tones: SCHEDULED/DRAW = blue, WIN/ACTIVE = emerald, LOSS/INACTIVE = rose,
 * PLAYED (no result) = neutral. Always carries a full text label + `aria-label`
 * so meaning is not conveyed by colour alone (§6 a11y).
 *
 * Wave 4 usage:
 *   <StatusChip status="SCHEDULED" />
 *   <StatusChip {...matchStatusKind(match.status, match.result)} />
 *   <StatusChip status={user.isActive ? "ACTIVE" : "INACTIVE"} />
 */
export type StatusKind =
  | "SCHEDULED"
  | "PLAYED"
  | "WIN"
  | "DRAW"
  | "LOSS"
  | "ACTIVE"
  | "INACTIVE";

type BadgeVariant = "neutral" | "success" | "info" | "danger";

const STATUS_STYLES: Record<
  StatusKind,
  { variant: BadgeVariant; label: string }
> = {
  SCHEDULED: { variant: "info", label: "Scheduled" },
  PLAYED: { variant: "neutral", label: "Played" },
  WIN: { variant: "success", label: "Win" },
  DRAW: { variant: "info", label: "Draw" },
  LOSS: { variant: "danger", label: "Loss" },
  ACTIVE: { variant: "success", label: "Active" },
  INACTIVE: { variant: "danger", label: "Inactive" },
};

type StatusChipProps = Readonly<{
  status: StatusKind;
  className?: string;
}>;

export function StatusChip({ status, className }: StatusChipProps) {
  const { variant, label } = STATUS_STYLES[status];
  return (
    <Badge variant={variant} aria-label={label} className={className}>
      {label}
    </Badge>
  );
}

/**
 * Resolve a Match's `status` + `result` into the right StatusChip kind:
 * SCHEDULED stays blue; a PLAYED match takes its result tone (WIN/DRAW/LOSS),
 * falling back to neutral PLAYED when the result is not set yet.
 */
export function matchStatusKind(
  status: MatchStatus,
  result: MatchResult | null,
): StatusChipProps {
  if (status === "SCHEDULED") {
    return { status: "SCHEDULED" };
  }
  if (result) {
    return { status: result };
  }
  return { status: "PLAYED" };
}
