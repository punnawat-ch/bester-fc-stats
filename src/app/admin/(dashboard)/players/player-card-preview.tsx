"use client";

import { useWatch, type Control } from "react-hook-form";

import { POSITION_BADGE } from "./position-pills";
import type { PlayerFormValues } from "./schema";

function monogram(name: string): string {
  const trimmed = name.trim();
  return trimmed === "" ? "?" : trimmed.slice(0, 2).toUpperCase();
}

type FigureProps = Readonly<{ name: string; imageUrl: string | null }>;

/** Cut-out photo standing on the pitch, or a monogram fallback (mirrors card). */
function PreviewFigure({ name, imageUrl }: FigureProps) {
  if (imageUrl) {
    return (
      <div className="absolute inset-0 grid items-end justify-items-center">
        <div className="squad-ground-shadow" />
        <div className="relative h-[84%] w-[74%]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt=""
            className="absolute inset-x-0 bottom-0 mx-auto h-full w-auto object-contain [filter:drop-shadow(0_18px_18px_rgba(0,0,0,0.45))]"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 grid place-items-center">
      <span className="text-[44px] font-extrabold tracking-tight text-white/15">
        {monogram(name)}
      </span>
    </div>
  );
}

type PlayerCardPreviewProps = Readonly<{
  control: Control<PlayerFormValues>;
  imageUrl: string | null;
  /** Pulse the card glow briefly after a successful save (reduced-motion safe). */
  celebrate: boolean;
}>;

/**
 * Live mini player card mirroring the `PlayerFlipCard` FRONT (night pitch,
 * cut-out figure, name/nickname/jersey/position badge). Reuses the shared
 * `.squad-*` pitch styling and updates as the admin types or toggles.
 */
export function PlayerCardPreview({
  control,
  imageUrl,
  celebrate,
}: PlayerCardPreviewProps) {
  const name = useWatch({ control, name: "name" }) ?? "";
  const nickname = useWatch({ control, name: "nickname" }) ?? "";
  const position = useWatch({ control, name: "position" }) ?? "";
  const jerseyNumber = useWatch({ control, name: "jerseyNumber" }) ?? null;
  const displayName = name.trim() === "" ? "New player" : name;

  return (
    <div
      className={`relative mx-auto aspect-[3/4] w-44 overflow-hidden rounded-2xl border border-white/10 shadow-[0_22px_60px_rgba(0,0,0,0.5)] ${
        celebrate ? "squad-celebrate" : ""
      }`}
    >
      <div className="squad-pitch">
        <div className="squad-halo" />
        <div className="squad-arc" />
      </div>
      <PreviewFigure name={name} imageUrl={imageUrl} />
      <div className="squad-scrim" />

      {position === "" ? null : (
        <span
          className={`absolute left-2.5 top-2.5 rounded-lg px-2 py-1 text-[10px] font-bold uppercase tracking-[0.16em] ${POSITION_BADGE[position]}`}
        >
          {position}
        </span>
      )}

      <div className="absolute inset-x-3 bottom-3">
        <div className="flex items-end justify-between gap-2">
          <div className="min-w-0">
            <div className="truncate text-sm font-extrabold leading-none tracking-tight text-white">
              {displayName}
            </div>
            {nickname.trim() === "" ? null : (
              <div className="mt-1 truncate text-[10px] tracking-wide text-white/60">
                {nickname}
              </div>
            )}
          </div>
          {jerseyNumber === null ? null : (
            <div className="text-[28px] font-extrabold leading-[0.8] tabular-nums text-white/90 [text-shadow:0_2px_18px_rgba(56,189,248,0.5)]">
              {jerseyNumber}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
