# Spec: Google Sheets → PostgreSQL + Prisma, Dynamic Content, Admin & RBAC

> โปรเจค: **Bester FC Stats** (Next.js 16 App Router / React 19 / TS / Tailwind v4)
> เป้าหมาย: ย้าย data source จาก Google Sheets → **Supabase Postgres + Prisma**, ลบ hardcode ทั้งหมดให้เป็น dynamic, เพิ่มหน้า **/admin** สำหรับจัดการข้อมูล พร้อม **ระบบ User + RBAC**

**ตัดสินใจแล้ว:** Auth = Auth.js (NextAuth v5) + Credentials · RBAC = role-based (ADMIN/EDITOR/VIEWER) · DB = Supabase Postgres

---

## 1. Scope / สิ่งที่ต้องทำ

### 1.1 ย้าย data source
- ลบ `src/lib/google-sheets.ts` และ dependency `googleapis`
- ลบ env `GOOGLE_*` (เก็บ snapshot ไว้ทำ seed ครั้งเดียว)
- `getFootballStats()` อ่านจาก Prisma แทน โดย**คง DTO `FootballStats` เดิม** → public components ไม่ต้องแก้ logic

### 1.2 ลบ hardcode → dynamic (จากผลสแกน)
| ที่อยู่เดิม | เนื้อหา hardcode | ย้ายไป |
| --- | --- | --- |
| `src/data/match-schedule.ts` | ตารางแข่ง 11 นัด | ตาราง `Match` (status=SCHEDULED) |
| `src/lib/google-sheets.ts:6` | Spreadsheet ID | ลบทิ้ง |
| `src/lib/google-sheets.ts:137` | club fallback "Bester Football Club" | `Club.name` |
| `src/components/TopBar.tsx` | ชื่อ, crest, **Facebook URL** | `Club` (name, crestUrl, facebookUrl) |
| `src/components/ClubHeader.tsx` | crest alt, ชื่อ | props จาก `Club` |
| `src/app/layout.tsx` | title/description/keywords/OG/siteUrl | `Club` + `generateMetadata()` |

### 1.3 หน้า /admin (CRUD)
จัดการ: **Club/Branding/SEO** · **Players** · **Matches** (history + schedule รวมกัน) · **Users** (ADMIN เท่านั้น)

### 1.4 Auth + RBAC
Login เข้า /admin, session แบบ JWT, guard ทั้ง route + server action ตาม role

---

## 2. Data Model (Prisma schema)

`Match` **รวม** MatchHistory + Schedule เป็นตารางเดียว แยกด้วย `status` (แหล่งความจริงเดียว, ลดความซ้ำ). `teamStats` (MP/W/D/L/GF/GA/GD) **คำนวณจาก Match** ไม่เก็บซ้ำ

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")       // Supabase pooled (pgbouncer) สำหรับ runtime
  directUrl = env("DIRECT_URL")          // Supabase direct สำหรับ migrate
}

// ---------- Domain ----------

model Club {
  id            String   @id @default(cuid())
  name          String                       // "Bester Football Club"
  shortName     String   @default("Bester FC")
  crestUrl      String?                       // โลโก้/ตราสโมสร
  // social
  facebookUrl   String?
  instagramUrl  String?
  // SEO / metadata
  siteUrl       String?
  seoTitle      String?
  seoDescription String?
  seoKeywords   String[] @default([])
  ogImageUrl    String?
  themeColor    String?  @default("#0b1124")
  recordedAt    DateTime @default(now())      // = "อัปเดตล่าสุด" ที่โชว์บนหน้าเว็บ
  players       Player[]
  matches       Match[]
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

model Player {
  id            String   @id @default(cuid())
  clubId        String
  club          Club     @relation(fields: [clubId], references: [id], onDelete: Cascade)
  name          String
  matchesPlayed Int      @default(0)
  goals         Int      @default(0)
  assists       Int      @default(0)
  cleanSheets   Int      @default(0)
  sortOrder     Int      @default(0)          // จัดลำดับแสดงผลใน admin
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@unique([clubId, name])
  @@index([clubId])
}

enum MatchStatus {
  SCHEDULED   // ตารางที่จะเตะ (เดิมอยู่ใน match-schedule.ts)
  PLAYED      // เตะจบแล้ว (เดิมอยู่ใน MatchHistory)
}

enum MatchResult {
  WIN
  DRAW
  LOSS
}

model Match {
  id            String       @id @default(cuid())
  clubId        String
  club          Club         @relation(fields: [clubId], references: [id], onDelete: Cascade)
  opponent      String                          // "No Doubt"
  date          DateTime                         // วันเตะจริง (ทั้ง scheduled/played)
  matchweek     String?                          // "Week 2" / label
  venue         String?                          // "Playmaker"
  field         String?                          // "Field 3"
  kickoff       String?                          // "18:00–20:00"
  status        MatchStatus  @default(SCHEDULED)
  goalsFor      Int?                             // เฉพาะ PLAYED
  goalsAgainst  Int?                             // เฉพาะ PLAYED
  result        MatchResult?                     // เฉพาะ PLAYED
  notes         String?
  seriesId      String?                          // group นัดที่มาจาก recurrence เดียวกัน (Google Calendar UX)
  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt

  @@index([clubId, status, date])
  @@index([seriesId])
}

// ---------- Auth / RBAC ----------

enum Role {
  ADMIN
  EDITOR
  VIEWER
}

model User {
  id           String    @id @default(cuid())
  email        String    @unique
  name         String?
  passwordHash String                          // argon2/bcrypt — ไม่เก็บ plaintext
  role         Role      @default(VIEWER)
  isActive     Boolean   @default(true)
  lastLoginAt  DateTime?
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
}
```

**หมายเหตุ model**
- ใช้ **JWT session** (Auth.js Credentials) → ไม่ต้องมีตาราง `Session`/`Account` ของ PrismaAdapter
- `teamStats` ไม่มีตาราง — derive ด้วย query (ดู §4.2)
- `venue`/`field` เก็บเป็น string ก่อน; ถ้าอยากทำ dropdown ค่อย normalize เป็น `Venue` model ทีหลัง
- `seriesId` รองรับ **recurrence** ใน admin (สร้างนัดซ้ำรายสัปดาห์แบบ Google Calendar): นัดที่ generate จากครั้งเดียวกันใช้ `seriesId` ร่วมกัน → ทำให้ edit/delete แบบ "this / this-and-following / all" ได้เชื่อถือได้ (ดู `admin-ux-spec.md` §Matches). นัดเดี่ยว `seriesId = null`
- **AuditLog เลื่อนไป phase ถัดไป** (ยังไม่ทำใน spec นี้) — จะเพิ่ม model + เขียน log ในทุก mutation ตอน scale มีหลาย editor

---

## 3. RBAC Design

### 3.1 Permission matrix

| Action | ADMIN | EDITOR | VIEWER |
| --- | :-: | :-: | :-: |
| `dashboard:view` | ✅ | ✅ | ✅ |
| `player:create/edit/delete` | ✅ | ✅ | ❌ |
| `match:create/edit/delete` | ✅ | ✅ | ❌ |
| `club:edit` (branding/SEO) | ✅ | ✅ | ❌ |
| `user:manage` (สร้าง/ลบ/เปลี่ยน role) | ✅ | ❌ | ❌ |

### 3.2 Authorization helper (single source of truth)

```ts
// src/lib/rbac.ts
import type { Role } from "@prisma/client";

export type Permission =
  | "dashboard:view"
  | "player:write"
  | "match:write"
  | "club:edit"
  | "user:manage";

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  ADMIN:  ["dashboard:view", "player:write", "match:write", "club:edit", "user:manage"],
  EDITOR: ["dashboard:view", "player:write", "match:write", "club:edit"],
  VIEWER: ["dashboard:view"],
};

export function can(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function assert(role: Role, permission: Permission): void {
  if (!can(role, permission)) {
    throw new ForbiddenError(permission); // แปลงเป็น 403 / typed action error
  }
}
```

ใช้ helper ตัวเดียวกันทั้ง 3 ชั้น: **middleware** (route), **server action** (mutation), **UI** (ซ่อนปุ่ม)

---

## 4. Data Layer Refactor

### 4.1 Prisma client singleton (สำคัญกับ Next dev hot-reload)

```ts
// src/lib/prisma.ts
import { PrismaClient } from "@prisma/client";
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
export const prisma = globalForPrisma.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

### 4.2 แทนที่ `getFootballStats()` (คง DTO เดิม → components ไม่ต้องแก้)

```ts
// src/lib/football.ts
import "server-only";
import { prisma } from "./prisma";
import type { FootballStats } from "../data/football-stats";

export async function getFootballStats(): Promise<FootballStats> {
  const club = await prisma.club.findFirstOrThrow({
    include: {
      players: { orderBy: [{ goals: "desc" }, { sortOrder: "asc" }] },
      matches: { where: { status: "PLAYED" }, orderBy: { date: "desc" } },
    },
  });

  // teamStats: derive จาก matches ที่ PLAYED
  const played = club.matches;
  const teamStats = {
    matchesPlayed: played.length,
    wins:   played.filter((m) => m.result === "WIN").length,
    draws:  played.filter((m) => m.result === "DRAW").length,
    losses: played.filter((m) => m.result === "LOSS").length,
    goalsFor:      played.reduce((s, m) => s + (m.goalsFor ?? 0), 0),
    goalsAgainst:  played.reduce((s, m) => s + (m.goalsAgainst ?? 0), 0),
    goalDifference: 0,
  };
  teamStats.goalDifference = teamStats.goalsFor - teamStats.goalsAgainst;

  return {
    club: club.name,
    recordedAt: club.recordedAt.toISOString(),
    teamStats,
    playerStats: club.players.map((p) => ({
      name: p.name, goals: p.goals, assists: p.assists,
      matchesPlayed: p.matchesPlayed, cleanSheets: p.cleanSheets,
    })),
    matchHistory: played.map((m) => ({
      date: m.matchweek ?? m.date.toISOString(),
      versus: m.opponent,
      score: m.goalsFor != null ? `${m.goalsFor}-${m.goalsAgainst}` : "N/A",
      result: m.result ? { WIN: "Win", DRAW: "Draw", LOSS: "Loss" }[m.result] : "N/A",
    })),
  };
}

// schedule: เดิม hardcode → อ่านจาก DB
export async function getMatchSchedule(clubId: string) {
  return prisma.match.findMany({
    where: { clubId, status: "SCHEDULED" },
    orderBy: { date: "asc" },
  });
}

// club branding สำหรับ TopBar / ClubHeader / metadata
export async function getClub() {
  return prisma.club.findFirstOrThrow();
}
```

### 4.3 ทำ branding/SEO เป็น dynamic
- `layout.tsx`: เปลี่ยน `export const metadata` → `export async function generateMetadata()` อ่านจาก `getClub()`
- `page.tsx`: ส่ง `club.crestUrl / shortName / facebookUrl` เป็น props ให้ `TopBar`, `ClubHeader`; ดึง schedule จาก `getMatchSchedule()` แทน import hardcoded
- ลบ `src/data/match-schedule.ts` (ย้ายค่าไป seed)

---

## 5. Admin — โครงสร้างหน้า

> **API strategy (phase นี้):** ใช้ **Server Actions** สำหรับทุก mutation + เรียก data layer ตรงใน server component สำหรับการอ่าน. **ยังไม่ทำ public/REST API ให้ third-party** — route handler มีแค่ `api/auth/[...nextauth]`. ถ้าอนาคตต้องเปิดให้ระบบอื่นดึงข้อมูล ค่อยเพิ่ม `app/api/v1/*` + API key/token auth (แยกจาก session) แล้ว reuse data layer เดิม

Feature-based (page / action / hooks / components ต่อ feature)

```
src/
  auth.ts                       # NextAuth config (Credentials + JWT + role callback)
  middleware.ts                 # ป้องกัน /admin/* ต้อง login
  app/
    api/auth/[...nextauth]/route.ts
    (public)/                   # หน้าเว็บสาธารณะเดิม (page.tsx ปัจจุบัน)
    (admin)/
      admin/
        layout.tsx              # guard: ต้อง login + sidebar; เช็ค dashboard:view
        page.tsx                # dashboard สรุป
        players/
          page.tsx  action.ts  columns.tsx  player-form.tsx
        matches/
          page.tsx  action.ts  columns.tsx  match-form.tsx
        club/
          page.tsx  action.ts  club-form.tsx     # branding + SEO + social
        users/                  # ADMIN only (guard ใน layout/page)
          page.tsx  action.ts  user-form.tsx
    login/page.tsx
```

- **Forms**: React Hook Form + Zod (มีใน skill set อยู่แล้ว); server action คืน typed result `{ ok, error? }`
- **Tables**: หน้า list ใช้ตารางง่าย ๆ + ปุ่ม edit/delete ที่ render ตาม `can(role, ...)`
- ทุก mutation อยู่ใน **server action** ที่เรียก `assert(session.user.role, ...)` เป็นด่านแรกเสมอ

### 5.1 ตัวอย่าง guarded server action

```ts
// app/(admin)/admin/matches/action.ts
"use server";
import { auth } from "@/auth";
import { assert } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { matchSchema } from "./schema";

export async function upsertMatch(input: unknown) {
  const session = await auth();
  if (!session) return { ok: false, error: "UNAUTHENTICATED" };
  assert(session.user.role, "match:write");           // RBAC

  const data = matchSchema.parse(input);              // Zod
  const saved = await prisma.match.upsert({
    where: { id: data.id ?? "" },
    create: { ...data, clubId: data.clubId },
    update: data,
  });
  revalidatePath("/");            // refresh หน้า public
  revalidatePath("/admin/matches");
  return { ok: true, id: saved.id };
}
```

### 5.2 Route guard (middleware)

```ts
// src/middleware.ts
export { auth as middleware } from "@/auth";
export const config = { matcher: ["/admin/:path*"] };
// ใน auth.ts callback: ถ้าเข้า /admin แล้วไม่มี session → redirect /login
```

---

## 6. Auth.js (NextAuth v5) setup

```ts
// src/auth.ts
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password"; // argon2

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      authorize: async (c) => {
        const user = await prisma.user.findUnique({ where: { email: String(c.email) } });
        if (!user || !user.isActive) return null;
        if (!(await verifyPassword(user.passwordHash, String(c.password)))) return null;
        await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
        return { id: user.id, email: user.email, name: user.name, role: user.role };
      },
    }),
  ],
  callbacks: {
    jwt: ({ token, user }) => { if (user) token.role = (user as any).role; return token; },
    session: ({ session, token }) => {
      session.user.id = token.sub!;
      session.user.role = token.role as any;
      return session;
    },
    authorized: ({ auth, request }) => {
      if (request.nextUrl.pathname.startsWith("/admin")) return !!auth;
      return true;
    },
  },
});
```

Security: hash ด้วย **argon2** (หรือ bcrypt), rate-limit หน้า login, CSRF จัดการโดย Auth.js, ใช้ `server-only` กับ data layer, ห้าม log password/token

---

## 7. Migration & Seed

### 7.1 ลำดับงาน
```bash
pnpm add @prisma/client next-auth@beta argon2 zod react-hook-form @hookform/resolvers
pnpm add -D prisma
pnpm prisma init --datasource-provider postgresql
# ใส่ schema §2 → migrate
pnpm prisma migrate dev --name init
pnpm prisma generate
```

### 7.2 Seed (`prisma/seed.ts`) — import ข้อมูลปัจจุบันครั้งเดียว
1. สร้าง `Club` (ชื่อ, crest, Facebook URL เดิมจาก TopBar, SEO เดิมจาก `layout.tsx`)
2. สร้าง admin user คนแรก (email + hash password จาก env `SEED_ADMIN_EMAIL/PASSWORD`)
3. Import **schedule 11 นัด** จาก `match-schedule.ts` → `Match` (status=SCHEDULED, แปลง `date` "10/01/26" → `DateTime`)
4. Import players + matchHistory จาก snapshot Google Sheet (ดึงครั้งสุดท้ายด้วย script เดิมก่อนลบ หรือ export CSV)

> แปลงข้อมูล: `date "dd/mm/yy"` → `Date`; `result "W/L/D"` → enum; `score "2-1"` → `goalsFor/goalsAgainst`

### 7.3 Env ที่เปลี่ยน (`.env.local`)
```
# ใหม่ (Supabase)
DATABASE_URL="postgresql://...pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://...supabase.com:5432/postgres"
AUTH_SECRET="<openssl rand -base64 32>"
SEED_ADMIN_EMAIL="admin@bester.fc"
SEED_ADMIN_PASSWORD="<เปลี่ยนหลัง login>"

# ลบทิ้ง
# NEXT_PUBLIC_USE_GOOGLE_SHEETS, GOOGLE_SHEETS_*_RANGE, GOOGLE_SERVICE_ACCOUNT_JSON
```

---

## 8. Task Breakdown (ลำดับแนะนำ)

**Phase 1 — DB & data layer (public เว็บยังทำงานเหมือนเดิม)**
1. เพิ่ม deps + `prisma init`, เขียน `schema.prisma` (§2), migrate บน Supabase
2. `src/lib/prisma.ts` singleton
3. เขียน seed + import ข้อมูลจริง (§7.2)
4. Refactor `football.ts` อ่านจาก Prisma (§4.2), ลบ `google-sheets.ts` + `match-schedule.ts` + dep `googleapis`
5. ทำ branding/SEO dynamic: `generateMetadata()`, ส่ง props club/schedule (§4.3)
6. ✅ verify: หน้า public แสดงผลเท่าเดิมโดยดึงจาก DB

**Phase 2 — Auth**
7. `auth.ts` (Credentials+JWT), `middleware.ts`, route handler, `/login`, `lib/password.ts`
8. `lib/rbac.ts` (§3.2) + augment type `session.user.role`

**Phase 3 — Admin CRUD**
9. `(admin)` layout + guard + sidebar + dashboard
10. Players CRUD (page/action/form) — guard `player:write`
11. Matches CRUD (รวม schedule+history, toggle status) — guard `match:write`
12. Club/Branding/SEO form — guard `club:edit`
13. Users management (ADMIN only) — guard `user:manage`
14. ทุก mutation `revalidatePath("/")` เพื่อ refresh หน้า public

**Phase 4 — Polish**
15. Rate-limit login, validation ครบ, empty states, error boundaries
16. อัปเดต `README.md` (ลบส่วน Google Sheets), เพิ่มวิธี run migrate/seed

---

## 9. จุดที่ต้องยืนยัน/ตัดสินใจเพิ่ม
- **Single-club** (ตอนนี้ 1 สโมสร) — model รองรับหลาย club แล้วแต่ admin ทำงานกับ club แรก ถ้าจะ multi-club ค่อยเพิ่ม club switcher
- Player stats จะ **กรอกมือ** (คงคอลัมน์ aggregate) หรืออนาคตทำ per-match events แล้ว derive — spec นี้เลือกกรอกมือก่อน
- `venue`/`field` เป็น free-text ก่อน; ทำ dropdown/normalize ทีหลังได้
- **Third-party API: เลื่อนออกไป** — phase นี้ใช้ Server Actions ล้วน ยังไม่เปิด public REST API (ดู §5)
