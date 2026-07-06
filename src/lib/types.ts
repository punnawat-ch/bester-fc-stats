export type PlayerPosition = "GK" | "DF" | "MF" | "FW";

/** Richer per-player card data for the public Squad flip cards (Wave 5.3). */
export type SquadPlayer = {
  id: string;
  name: string;
  nickname: string | null;
  position: PlayerPosition | null;
  jerseyNumber: number | null;
  imageUrl: string | null;
  goals: number;
  assists: number;
  matchesPlayed: number;
  cleanSheets: number;
  yellowCards: number;
  redCards: number;
  motm: number;
  saves: number;
};

export type ScheduleMatch = {
  month: string;
  week: string;
  date: string;
  opponent: string;
  venue: string;
  field?: string;
  time: string;
  notes?: string;
};
