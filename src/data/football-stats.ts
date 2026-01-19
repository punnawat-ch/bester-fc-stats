export interface TeamStats {
  matchesPlayed: number;
  wins: number;
  draws: number;
  losses: number;
}

export interface PlayerStats {
  name: string;
  goals: number;
  assists: number;
  cleanSheets: number;
}

export interface FootballStats {
  club: string;
  recordedAt: string;
  teamStats: TeamStats;
  playerStats: PlayerStats[];
}

export const footballStats: FootballStats = {
  club: "Bester Football Club",
  recordedAt: "2026-01-18T11:29:00+07:00",
  teamStats: {
    matchesPlayed: 2,
    wins: 1,
    draws: 1,
    losses: 0,
  },
  playerStats: [
    { name: "พี่โต้ง", goals: 2, assists: 0, cleanSheets: 0 },
    { name: "พี่กี้", goals: 2, assists: 0, cleanSheets: 0 },
    { name: "พี่ปุ้ม", goals: 0, assists: 1, cleanSheets: 0 },
    { name: "พี่ไอซ์", goals: 1, assists: 0, cleanSheets: 0 },
    { name: "เหวิน", goals: 1, assists: 0, cleanSheets: 0 },
    { name: "พี่เต๋า", goals: 1, assists: 1, cleanSheets: 0 },
    { name: "พี่ไบรท์", goals: 1, assists: 0, cleanSheets: 0 },
    { name: "พี่เต้", goals: 0, assists: 2, cleanSheets: 0 },
    { name: "พี่กิต", goals: 0, assists: 1, cleanSheets: 0 },
    { name: "พี่เสือ", goals: 0, assists: 1, cleanSheets: 0 },
  ],
};

