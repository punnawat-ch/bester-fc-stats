"use client";

import Image from "next/image";
import { useState } from "react";

import type { PlayerPosition, SquadPlayer } from "../lib/types";

type PlayerFlipCardProps = Readonly<{
  player: SquadPlayer;
}>;

// Responsive card widths: 2 cols (~45vw) → 3 cols (~30vw) → 4 cols (~280px).
const FIGURE_SIZES = "(min-width: 1024px) 280px, (min-width: 640px) 30vw, 45vw";

// Front position badge: GK amber / DF violet / MF sky / FW emerald.
const POSITION_BADGE: Record<PlayerPosition, string> = {
  GK: "bg-amber-400 text-[#061018]",
  DF: "bg-violet-400 text-[#061018]",
  MF: "bg-sky-400 text-[#061018]",
  FW: "bg-emerald-400 text-[#061018]",
};

function monogram(name: string): string {
  return name.slice(0, 2).toUpperCase();
}

type PlayerFigureProps = Readonly<{
  name: string;
  imageUrl: string | null;
}>;

// Cut-out player photo standing on the pitch, or a monogram fallback.
function PlayerFigure({ name, imageUrl }: PlayerFigureProps) {
  if (imageUrl) {
    return (
      <div className="absolute inset-0 grid items-end justify-items-center">
        <div className="squad-ground-shadow" />
        <div className="relative h-[84%] w-[74%]">
          <Image
            src={imageUrl}
            alt=""
            fill
            sizes={FIGURE_SIZES}
            className="object-contain object-bottom [filter:drop-shadow(0_18px_18px_rgba(0,0,0,0.45))]"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 grid place-items-center">
      <span className="text-[52px] font-extrabold tracking-tight text-white/15">
        {monogram(name)}
      </span>
    </div>
  );
}

type StatTileProps = Readonly<{
  label: string;
  value: number;
  valueClass?: string;
}>;

function StatTile({ label, value, valueClass = "text-white" }: StatTileProps) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 px-2.5 py-2 backdrop-blur">
      <div className="text-[9.5px] uppercase tracking-[0.14em] text-white/40">
        {label}
      </div>
      <div
        className={`mt-0.5 text-[22px] font-extrabold leading-tight tabular-nums ${valueClass}`}
      >
        {value}
      </div>
    </div>
  );
}

type BackStat = Readonly<{
  label: string;
  value: number;
  valueClass?: string;
}>;

function keeperPrimaryTiles(player: SquadPlayer): BackStat[] {
  return [
    { label: "Clean sheets", value: player.cleanSheets, valueClass: "text-emerald-300" },
    { label: "Saves", value: player.saves, valueClass: "text-sky-300" },
  ];
}

function outfieldPrimaryTiles(player: SquadPlayer): BackStat[] {
  return [
    { label: "Goals", value: player.goals, valueClass: "text-emerald-300" },
    { label: "Assists", value: player.assists, valueClass: "text-sky-300" },
  ];
}

function buildStatTiles(player: SquadPlayer): BackStat[] {
  const primary =
    player.position === "GK"
      ? keeperPrimaryTiles(player)
      : outfieldPrimaryTiles(player);
  const secondary: BackStat[] = [
    { label: "Apps", value: player.matchesPlayed },
    { label: "MOTM", value: player.motm, valueClass: "text-amber-300" },
  ];
  return [...primary, ...secondary];
}

// Client component: click/tap toggles the CSS 3D flip (aria-pressed state).
export default function PlayerFlipCard({ player }: PlayerFlipCardProps) {
  const [flipped, setFlipped] = useState(false);
  const {
    name,
    nickname,
    position,
    jerseyNumber,
    imageUrl,
    yellowCards,
    redCards,
  } = player;
  const tiles = buildStatTiles(player);

  return (
    <button
      type="button"
      className="squad-card fade-in-up"
      aria-pressed={flipped}
      aria-label={`${name}, tap to see stats`}
      onClick={() => setFlipped((prev) => !prev)}
    >
      <div className="squad-card-inner">
        <div className="squad-card-face squad-card-front">
          <div className="squad-pitch">
            <div className="squad-halo" />
            <div className="squad-arc" />
          </div>
          <PlayerFigure name={name} imageUrl={imageUrl} />
          <div className="squad-scrim" />
          {position ? (
            <span
              className={`absolute left-3 top-3 rounded-lg px-2 py-1 text-[10.5px] font-bold uppercase tracking-[0.16em] ${POSITION_BADGE[position]}`}
            >
              {position}
            </span>
          ) : null}
          <span className="absolute right-3 top-3 rounded-full border border-white/10 bg-black/25 px-2 py-1 text-[10px] tracking-[0.1em] text-white/40">
            stats ›
          </span>
          <div className="absolute inset-x-3.5 bottom-3.5">
            <div className="flex items-end justify-between gap-2">
              <div>
                <div className="text-[clamp(16px,2.4vw,21px)] font-extrabold leading-none tracking-tight text-white">
                  {name}
                </div>
                {nickname ? (
                  <div className="mt-1 text-[11px] tracking-wide text-white/60">
                    {nickname}
                  </div>
                ) : null}
              </div>
              {jerseyNumber === null ? null : (
                <div className="text-[clamp(30px,5.4vw,46px)] font-extrabold leading-[0.8] tabular-nums text-white/90 [text-shadow:0_2px_18px_rgba(56,189,248,0.5)]">
                  {jerseyNumber}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="squad-card-face squad-card-back">
          <div className="squad-pitch">
            <div className="squad-arc" />
          </div>
          <div className="absolute inset-0 flex flex-col p-4">
            <div className="flex items-baseline justify-between">
              <div>
                <div className="text-base font-extrabold tracking-tight text-white">
                  {name}
                </div>
                <div className="mt-0.5 text-[10px] uppercase tracking-[0.22em] text-white/40">
                  Season 2026 · {position ?? "—"}
                </div>
              </div>
              {jerseyNumber === null ? null : (
                <div className="text-xl font-extrabold tabular-nums text-sky-400">
                  {jerseyNumber}
                </div>
              )}
            </div>
            <div className="mt-auto grid grid-cols-2 gap-2">
              {tiles.map((tile) => (
                <StatTile
                  key={tile.label}
                  label={tile.label}
                  value={tile.value}
                  valueClass={tile.valueClass}
                />
              ))}
              <div className="col-span-2 flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-2.5 py-2 backdrop-blur">
                <span className="text-[9.5px] uppercase tracking-[0.14em] text-white/40">
                  Cards
                </span>
                <span className="flex items-center gap-3 text-[18px] font-extrabold tabular-nums">
                  <span className="text-amber-300">
                    {yellowCards}
                    <span className="ml-1 text-[9px] font-semibold tracking-[0.14em] text-amber-300/70">
                      YEL
                    </span>
                  </span>
                  <span className="text-rose-300">
                    {redCards}
                    <span className="ml-1 text-[9px] font-semibold tracking-[0.14em] text-rose-300/70">
                      RED
                    </span>
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </button>
  );
}
