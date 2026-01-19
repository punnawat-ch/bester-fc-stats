import { google } from "googleapis";

import type { FootballStats } from "../data/football-stats";

const SPREADSHEET_ID =
  "1CybmQCvd03npZdXQ6bWQiig03jTqi3910jjoDMW2Gwg";

function getServiceAccountAuth() {
  const json = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;

  if (!json) {
    throw new Error("Missing GOOGLE_SERVICE_ACCOUNT_JSON");
  }

  const credentials = JSON.parse(json) as {
    client_email?: string;
    private_key?: string;
  };

  if (credentials.private_key) {
    credentials.private_key = credentials.private_key.replaceAll(
      String.raw`\n`,
      "\n",
    );
  }

  return new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });
}

export function getSheetsClient() {
  const auth = getServiceAccountAuth();
  return google.sheets({ version: "v4", auth });
}

function parseNumber(value: string | undefined) {
  if (!value) {
    return 0;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeHeaders(headers: string[]) {
  return headers.map((header) => header.trim().toLowerCase());
}

export async function fetchFootballStatsFromSheet(): Promise<FootballStats> {
  const metaRange = process.env.GOOGLE_SHEETS_META_RANGE ?? "Meta!A1:B9";
  const playersRange =
    process.env.GOOGLE_SHEETS_PLAYERS_RANGE ?? "Players!A1:D100";

  const sheets = getSheetsClient();
  const [metaSheet, playersSheet] = await Promise.all([
    sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: metaRange,
    }),
    sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: playersRange,
    }),
  ]);

  return buildStatsFromRows(
    metaSheet.data.values ?? [],
    playersSheet.data.values ?? [],
  );
}

function buildStatsFromRows(
  metaRows: string[][],
  playerRows: string[][],
): FootballStats {
  const meta = Object.fromEntries(
    metaRows.map((row) => [row[0]?.trim(), row[1] ?? ""]),
  );

  const [rawHeaders, ...rows] = playerRows;
  const headers = rawHeaders ? normalizeHeaders(rawHeaders) : [];

  const getCell = (row: string[], key: string) => {
    const index = headers.indexOf(key);
    return index >= 0 ? row[index] : undefined;
  };

  const playerStats = rows
    .filter((row) => row.some((cell) => cell?.trim()))
    .map((row) => ({
      name: getCell(row, "name") ?? "Unknown",
      goals: parseNumber(getCell(row, "goals")),
      assists: parseNumber(getCell(row, "assists")),
      cleanSheets: parseNumber(getCell(row, "cleansheets")),
    }));

  return {
    club: meta.Club ?? "Bester Football Club",
    recordedAt: meta.RecordedAt ?? new Date().toISOString(),
    teamStats: {
      matchesPlayed: parseNumber(meta.MatchesPlayed),
      wins: parseNumber(meta.Wins),
      draws: parseNumber(meta.Draws),
      losses: parseNumber(meta.Losses),
      goalsFor: parseNumber(meta.GF),
      goalsAgainst: parseNumber(meta.GA),
      goalDifference: parseNumber(meta.GD),
    },
    playerStats,
  };
}