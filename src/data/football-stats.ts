export interface TeamStats {
  matchesPlayed: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
}

export interface PlayerStats {
  name: string;
  goals: number;
  assists: number;
  matchesPlayed: number;
  cleanSheets: number;
}

export interface MatchHistory {
  date: string;
  versus: string;
  score: string;
  result: string;
}
export interface FootballStats {
  club: string;
  recordedAt: string;
  teamStats: TeamStats;
  playerStats: PlayerStats[];
  matchHistory: MatchHistory[];
}
