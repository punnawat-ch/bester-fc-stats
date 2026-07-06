/**
 * One-off importer: pull Players + MatchHistory from the legacy Google Sheet
 * into Postgres (Prisma). Run once to backfill data that the Sheets→DB
 * migration left as a TODO, then this file + the googleapis devDep can be removed.
 *
 * Usage:
 *   node --env-file=.env --env-file=<creds>.env --import tsx prisma/import-from-sheets.ts --dry
 *   (drop --dry to actually write)
 */
import { google } from "googleapis";
import { PrismaClient, type MatchResult } from "@prisma/client";

const prisma = new PrismaClient();

const SPREADSHEET_ID =
  process.env.SHEETS_SPREADSHEET_ID ??
  "1CybmQCvd03npZdXQ6bWQiig03jTqi3910jjoDMW2Gwg";
const DRY = process.argv.includes("--dry");

function getAuth() {
  const json = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!json) {
    throw new Error("Missing GOOGLE_SERVICE_ACCOUNT_JSON");
  }
  const credentials = JSON.parse(json) as {
    client_email?: string;
    private_key?: string;
  };
  if (credentials.private_key) {
    credentials.private_key = credentials.private_key.replaceAll("\\n", "\n");
  }
  return new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });
}

function num(value: string | undefined): number {
  const parsed = Number((value ?? "").trim());
  return Number.isFinite(parsed) ? parsed : 0;
}

function rowsToObjects(
  values: unknown[][] | null | undefined,
): Record<string, string>[] {
  const [rawHeaders, ...rows] = (values ?? []) as unknown[][];
  const headers = ((rawHeaders as unknown[]) ?? []).map((h) =>
    String(h ?? "").trim().toLowerCase(),
  );
  return rows
    .filter((row) => (row as unknown[]).some((cell) => String(cell ?? "").trim()))
    .map((row) => {
      const obj: Record<string, string> = {};
      headers.forEach((h, i) => {
        obj[h] = String((row as unknown[])[i] ?? "");
      });
      return obj;
    });
}

function parseResult(value: string | undefined): MatchResult | null {
  const v = (value ?? "").trim().toUpperCase();
  if (v.startsWith("W")) return "WIN";
  if (v.startsWith("L")) return "LOSS";
  if (v.startsWith("D")) return "DRAW";
  return null;
}

function parseDmy(value: string | undefined): Date | null {
  const m = /(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})/.exec(value ?? "");
  if (!m) return null;
  const day = Number(m[1]);
  const month = Number(m[2]);
  const year = Number(m[3]) < 100 ? 2000 + Number(m[3]) : Number(m[3]);
  return new Date(year, month - 1, day, 12, 0);
}

function parseScore(value: string | undefined): {
  goalsFor: number | null;
  goalsAgainst: number | null;
} {
  const m = /(\d+)\s*[-–:]\s*(\d+)/.exec(value ?? "");
  if (!m) return { goalsFor: null, goalsAgainst: null };
  return { goalsFor: Number(m[1]), goalsAgainst: Number(m[2]) };
}

async function main() {
  const sheets = google.sheets({ version: "v4", auth: getAuth() });

  const [playersRes, historyRes] = await Promise.all([
    sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: process.env.SHEETS_PLAYERS_RANGE ?? "Players!A1:E100",
    }),
    sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: process.env.SHEETS_MATCH_HISTORY_RANGE ?? "MatchHistory!A1:D100",
    }),
  ]);

  const playerRows = rowsToObjects(playersRes.data.values);
  const historyRows = rowsToObjects(historyRes.data.values);

  console.log(`\n=== Players (${playerRows.length}) ===`);
  console.log(JSON.stringify(playerRows, null, 2));
  console.log(`\n=== MatchHistory (${historyRows.length}) ===`);
  console.log(JSON.stringify(historyRows, null, 2));

  if (DRY) {
    console.log("\n[dry-run] no writes performed.");
    return;
  }

  const club = await prisma.club.findFirstOrThrow();

  // ---- Players: upsert by (clubId, name) ----
  let playerCount = 0;
  for (const [i, r] of playerRows.entries()) {
    const name = (r["name"] ?? "").trim();
    if (!name) continue;
    const data = {
      matchesPlayed: num(r["matchplayed"] ?? r["matchesplayed"]),
      goals: num(r["goals"]),
      assists: num(r["assists"]),
      cleanSheets: num(r["cleansheets"]),
      sortOrder: i,
    };
    await prisma.player.upsert({
      where: { clubId_name: { clubId: club.id, name } },
      create: { clubId: club.id, name, ...data },
      update: data,
    });
    playerCount += 1;
  }
  console.log(`Upserted ${playerCount} players`);

  // ---- Match history (status = PLAYED): replace prior PLAYED rows ----
  await prisma.match.deleteMany({ where: { clubId: club.id, status: "PLAYED" } });
  // The sheet's `matchweek` column actually holds the played date "dd/mm/yyyy".
  // Use it for the real `date` (ordering) and keep the raw string in `matchweek`
  // so the public table displays exactly what the sheet showed.
  const fallbackBase = new Date(2026, 0, 1);
  const playedData = historyRows
    .map((r, i) => {
      const opponent = (r["versus"] ?? r["opponent"] ?? "").trim();
      if (!opponent) return null;
      const { goalsFor, goalsAgainst } = parseScore(r["scores"] ?? r["score"]);
      const rawWeek = (r["matchweek"] ?? "").trim();
      const parsedDate = parseDmy(rawWeek);
      const date = parsedDate ?? new Date(fallbackBase.getTime() + i * 7 * 86400000);
      return {
        clubId: club.id,
        opponent,
        date,
        matchweek: rawWeek || null,
        goalsFor,
        goalsAgainst,
        result: parseResult(r["results"] ?? r["result"]),
        status: "PLAYED" as const,
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  if (playedData.length > 0) {
    await prisma.match.createMany({ data: playedData });
  }
  console.log(`Inserted ${playedData.length} played matches`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
