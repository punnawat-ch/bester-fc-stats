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

function parseResult(value: string | undefined) {
  if (!value) {
    return "N/A";
  }
  if (value === "W") {
    return "Win";
  }
  if (value === "L") {
    return "Loss";
  }
  if (value === "D") {
    return "Draw";
  }
  return "Unknown";
}

function parseNumber(value: string | undefined) {
  if (!value || value === "") {
    return 0;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeHeaders(headers: string[]) {
  const normalized = headers.map((header) => header?.trim().toLowerCase());
  return normalized;
}

export async function fetchFootballStatsFromSheet(): Promise<FootballStats> {
  const metaRange = process.env.GOOGLE_SHEETS_META_RANGE ?? "Meta!A1:B9";
  const playersRange =
    process.env.GOOGLE_SHEETS_PLAYERS_RANGE ?? "Players!A1:E100";
  const matchHistoryRange =
    process.env.GOOGLE_SHEETS_MATCH_HISTORY_RANGE ?? "MatchHistory!A1:D100";

  const sheets = getSheetsClient();
  const [metaSheet, playersSheet, matchHistorySheet] = await Promise.all([
    sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: metaRange,
    }),
    sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: playersRange,
    }),
    sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: matchHistoryRange,
    }),
  ]);

  return buildStatsFromRows(
    metaSheet.data.values ?? [],
    playersSheet.data.values ?? [],
    matchHistorySheet.data.values ?? [],
  );
}

function buildStatsFromRows(
  metaRows: string[][],
  playerRows: string[][],
  matchHistoryRows: string[][],
): FootballStats {
  const meta = Object.fromEntries(
    metaRows.map((row) => [row[0]?.trim(), row[1] ?? ""]),
  );

  const [rawHeaders, ...rows] = playerRows;
  const [matchHistoryRawHeaders, ...rowsMatchHistory] = matchHistoryRows;
  const playerHeaders = rawHeaders ? normalizeHeaders(rawHeaders) : [];
  const matchHistoryHeaders = matchHistoryRawHeaders ? normalizeHeaders(matchHistoryRawHeaders) : [];

  const getCell = (headers: string[], row: string[], key: string) => {
    const index = headers.indexOf(key.toLowerCase());
    return index >= 0 ? row[index] : undefined;
  };


  const matchHistoryStats = rowsMatchHistory
    .filter((row) => row.some((cell) => cell?.trim()))
    .map((row) => ({
      date: getCell(matchHistoryHeaders, row, "matchweek") ?? "Unknown",
      versus: getCell(matchHistoryHeaders, row, "versus") ?? "Unknown",
      score: getCell(matchHistoryHeaders, row, "scores") ?? "Unknown",
      result: parseResult(getCell(matchHistoryHeaders, row, "results")),
    }));

  const playerStats = rows
    .filter((row) => row.some((cell) => cell?.trim()))
    .map((row) => ({
      name: getCell(playerHeaders, row, "name") ?? "Unknown",
      matchesPlayed: parseNumber(getCell(playerHeaders, row, "matchplayed")),
      goals: parseNumber(getCell(playerHeaders, row, "goals")),
      assists: parseNumber(getCell(playerHeaders, row, "assists")),
      cleanSheets: parseNumber(getCell(playerHeaders, row, "cleansheets")),
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
    matchHistory: matchHistoryStats,
  };
}