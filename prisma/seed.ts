import { PrismaClient } from "@prisma/client";
import * as argon2 from "argon2";

const prisma = new PrismaClient();

// ---------- Club branding / SEO (snapshot จาก TopBar + layout.tsx เดิม) ----------
const CLUB = {
  name: "Bester Football Club",
  shortName: "Bester FC",
  crestUrl: "/logo.png",
  facebookUrl:
    "https://www.facebook.com/people/Bester-Footballclub/61569445073979/",
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  seoTitle: "Bester FC Match Results & Rankings",
  seoDescription:
    "Official Bester FC football dashboard showing match results, league rankings, and player performance statistics.",
  seoKeywords: [
    "Bester FC",
    "bester fc match results",
    "bester fc rankings",
    "football results",
    "league table",
    "player statistics",
  ],
  ogImageUrl: "/og-match-results.png",
  themeColor: "#0b1124",
};

// ---------- Scheduled matches (snapshot จาก src/data/match-schedule.ts เดิม) ----------
type SeedScheduleMatch = {
  week: string;
  date: string; // "dd/mm/yy"
  opponent: string;
  venue: string;
  field?: string;
  time: string; // kickoff string
};

const SCHEDULE: SeedScheduleMatch[] = [
  {
    week: "Week 2",
    date: "10/01/26",
    opponent: "No Doubt",
    venue: "Playmaker",
    field: "Field 3",
    time: "18:00–20:00",
  },
  {
    week: "Week 3",
    date: "17/01/26",
    opponent: "Azura FC",
    venue: "Playmaker",
    field: "Field 1",
    time: "18:00–20:00",
  },
  {
    week: "Week 4",
    date: "24/01/26",
    opponent: "Backup",
    venue: "Playmaker",
    field: "Field 3",
    time: "18:00–20:00",
  },
  {
    week: "Week 5",
    date: "31/01/26",
    opponent: "MID",
    venue: "Playmaker",
    field: "Field 2",
    time: "18:00–20:00",
  },
  {
    week: "Week 1",
    date: "07/02/26",
    opponent: "ONCE A WEEK FC",
    venue: "Playmaker",
    field: "Field 3",
    time: "18:00–20:00",
  },
  {
    week: "Week 3",
    date: "21/02/26",
    opponent: "Uncle",
    venue: "Alpine Football Camp Training Bangkok",
    time: "19.00-21.00",
  },
  {
    week: "Week 4",
    date: "28/02/26",
    opponent: "เตี๋ยวกระเพรา",
    venue: "สนามESP",
    time: "18:00–20:00",
  },
  {
    week: "Week 1",
    date: "07/03/26",
    opponent: "มั่งมี ศรีสุข",
    venue: "Playmaker",
    field: "Field 3",
    time: "18:00–20:00",
  },
  {
    week: "Week 3",
    date: "21/03/26",
    opponent: "Can do FC",
    venue: "Playmaker",
    field: "Field 3",
    time: "18:00–20:00",
  },
  {
    week: "Week 4",
    date: "28/03/26",
    opponent: "No Doubt",
    venue: "Playmaker",
    field: "Field 3",
    time: "18:00–20:00",
  },
  {
    week: "Week 2",
    date: "09/05/26",
    opponent: "มั่งมี ศรีสุข",
    venue: "Playmaker",
    field: "Field 3",
    time: "18:00–20:00",
  },
];

// "dd/mm/yy" (+ optional start time from kickoff) → Date
function parseScheduleDate(date: string, time: string): Date {
  const [day, month, year] = date.split("/").map(Number);
  const fullYear = year < 100 ? 2000 + year : year;
  const start = /(\d{1,2})[:.](\d{2})/.exec(time);
  const hours = start ? Number(start[1]) : 12;
  const minutes = start ? Number(start[2]) : 0;
  return new Date(fullYear, month - 1, day, hours, minutes);
}

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL;
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    throw new Error(
      "Missing SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD env vars for seeding.",
    );
  }

  // 1) Club
  const club = await prisma.club.create({ data: CLUB });
  console.log(`Created club: ${club.name} (${club.id})`);

  // 2) Admin user (argon2 hashed password)
  const passwordHash = await argon2.hash(adminPassword);
  const admin = await prisma.user.create({
    data: {
      email: adminEmail,
      name: "Admin",
      passwordHash,
      role: "ADMIN",
      isActive: true,
    },
  });
  console.log(`Created admin user: ${admin.email}`);

  // 3) Scheduled matches (status = SCHEDULED)
  await prisma.match.createMany({
    data: SCHEDULE.map((m) => ({
      clubId: club.id,
      opponent: m.opponent,
      date: parseScheduleDate(m.date, m.time),
      matchweek: m.week,
      venue: m.venue,
      field: m.field ?? null,
      kickoff: m.time,
      status: "SCHEDULED" as const,
    })),
  });
  console.log(`Created ${SCHEDULE.length} scheduled matches`);

  // 4) Players + match history
  // TODO: source ข้อมูลผู้เล่นและ match history เดิมมาจาก Google Sheets ที่ถูกลบไปแล้ว.
  //       ให้ export/snapshot จาก sheet เก่า (Players / MatchHistory ranges) แล้ว insert ที่นี่:
  //         - prisma.player.createMany({ data: [...] })  // name, matchesPlayed, goals, assists, cleanSheets, sortOrder
  //         - prisma.match.createMany({ data: [...] })   // status: "PLAYED", goalsFor, goalsAgainst, result
  //       ตอนนี้เว้นว่างไว้ (teamStats/playerStats จะเป็นค่าว่างจนกว่าจะ import).
  console.log("Skipped players/match-history seed (see TODO in prisma/seed.ts)");
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
