import type { PlayerPosition } from "./schema";

/**
 * Plain serialisable player shape passed from the server list page down to the
 * client manager (Prisma `Date` fields are dropped — the UI never needs them).
 */
export type PlayerDTO = Readonly<{
  id: string;
  name: string;
  nickname: string | null;
  position: PlayerPosition | null;
  jerseyNumber: number | null;
  imageUrl: string | null;
  matchesPlayed: number;
  goals: number;
  assists: number;
  cleanSheets: number;
  yellowCards: number;
  redCards: number;
  motm: number;
  saves: number;
  sortOrder: number;
}>;
