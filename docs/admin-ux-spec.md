# Spec: /admin Management Area — UX/UI (Mobile-First)

> โปรเจค: **Bester FC Stats** · Next.js 16 App Router / React 19 / TS / **Tailwind CSS v4** / Framer Motion
> เอกสารนี้เป็น **UX/UI spec ของโซน `/admin`** คู่กับ [`migration-spec.md`](./migration-spec.md)
> ยึด data model, RBAC (§3), server-action architecture (§5) จาก migration-spec — เอกสารนี้ **ไม่ทวน** schema ทั้งหมด แต่จะอ้างอิงเป็นจุด ๆ

**หลักคิดสูงสุด 2 ข้อ**
1. **MOBILE-FIRST** — แอดมินใช้บนมือถือเป็นหลัก ทุกหน้าออกแบบที่ breakpoint มือถือก่อน แล้วค่อยขยายขึ้น tablet/desktop
2. **Match scheduling = Google Calendar** — การสร้าง/จัดการนัด (Match `status=SCHEDULED`) ต้องรู้สึกเหมือนสร้าง event ใน Google Calendar

---

## 1. Design Principles

| # | หลักการ | ความหมายเชิงปฏิบัติ |
| --- | --- | --- |
| 1 | **Mobile-first, thumb-first** | ออกแบบที่ base (มือถือ) ก่อนเสมอ; primary action อยู่ **1/3 ล่างของจอ** (bottom nav, FAB, sticky save bar); tap target ≥ **44×44px** |
| 2 | **Calendar-native scheduling** | ตารางแข่งไม่ใช่ "ฟอร์มในตาราง" แต่เป็น **ปฏิทิน**: Agenda list เป็น default บนมือถือ, create-event เป็น bottom-sheet, มี recurrence รายสัปดาห์ |
| 3 | **Glass consistency** | แอดมินต้องเป็นผลิตภัณฑ์เดียวกับหน้า public — dark stadium + glassmorphism, token ชุดเดียวกัน (§3) |
| 4 | **Role-aware UI** | UI **ซ่อน/disable** ตาม `can(role, permission)` เสมอ (ชั้นที่ 3 ของ RBAC) — แต่ security จริงอยู่ที่ server action |
| 5 | **Low-friction data entry** | single-column form, native input types, inline validation, optimistic UI, bottom-sheet แทน dropdown จิ๋ว, มี "auto-suggest" (เช่น matchweek จาก date) |
| 6 | **Resilient on flaky mobile networks** | optimistic update + pending state + toast error ที่ rollback ได้ชัดเจน |

---

## 2. Information Architecture & Navigation

### 2.1 Route map (`(admin)/admin/*`)

ตาม migration-spec §5 — feature-based:

```
/login                     # นอก (admin) group — public, ไม่มี admin shell
(admin)/
  admin/                   # layout.tsx = admin shell (guard: login + dashboard:view)
    (index)  page.tsx      # /admin            Dashboard
    players/ page.tsx      # /admin/players    Players list (card/table)
             [id]/         # (optional) deep link ฟอร์ม; ค่าเริ่ม = sheet ลอย
    matches/ page.tsx      # /admin/matches    Calendar / Agenda (Google-Calendar UX)
    club/    page.tsx      # /admin/club       Club / Branding / SEO
    users/   page.tsx      # /admin/users      Users (ADMIN only)
    account/ page.tsx      # /admin/account    เปลี่ยนรหัสผ่านตัวเอง (ทุก role)
```

> **หมายเหตุ:** ฟอร์ม create/edit ของ Players/Matches/Users เป็น **Sheet/Dialog ซ้อนบน list route** (ไม่ push เป็นหน้าใหม่) เพื่อให้ back-gesture บนมือถือปิด sheet ได้แทนที่จะเด้งออกทั้งหน้า. ใช้ **intercepting/parallel routes** หรือ client-state ก็ได้ — แนะนำ client-state (`useState`/`nuqs` query param `?edit=<id>`) เพื่อความง่ายและ deep-link ได้.

### 2.2 Navigation — mobile-first

**Base (มือถือ, `<md`): Bottom Tab Bar เป็น navigation หลัก**

- Fixed ล่างจอ, `env(safe-area-inset-bottom)` padding (iPhone notch/home-indicator)
- 5 ช่องสูงสุด (กฎ mobile nav): **Dashboard · Players · Matches · Club · More**
- ช่องที่ role ไม่มีสิทธิ์ → ซ่อน; ถ้าเกิน 5 ช่อง หรือมี Users (ADMIN) → ยัดใน **"More"** (เปิด bottom-sheet menu)
- แต่ละ tab: icon (24px) + label (10px), แตะได้ทั้งบล็อก ≥ 56px สูง
- active tab: icon สี sky-300 + เส้น glow บน, inactive: `text-white/50`

```
┌───────────────────────────────────┐
│                                   │  ← content scrolls
│                                   │
├───────────────────────────────────┤
│  ▓        ·        ·      ·     ·  │  active indicator (sky glow)
│  🏠      👥       📅      ⚙️     ⋯  │  ← 56px tall, safe-area padding
│ Dash   Players  Matches Club  More│
└───────────────────────────────────┘
```

**Top bar (มือถือ):** sticky บนสุด สูง 52px — ซ้าย = ชื่อหน้า/ครุฑสโมสร, ขวา = avatar (แตะ → account sheet: role badge, เปลี่ยนรหัส, logout). ไม่ใช้ hamburger เป็น nav หลัก; drawer เป็น **secondary** เท่านั้น (เปิดจาก "More" หรือ avatar).

**md+ (tablet/desktop): Sidebar ซ้าย + top bar**

- Bottom tab bar **ซ่อน**, เปลี่ยนเป็น **sidebar** ถาวรซ้าย (กว้าง `w-64`), collapsible เป็น icon-rail (`w-16`) ที่ `md`
- เมนูเดียวกับ tab bar + เพิ่ม Users / Account เต็มรูป
- content ขยับขวา `md:ml-64`

### 2.3 Role-based menu visibility

| เมนู | Permission gate | ADMIN | EDITOR | VIEWER |
| --- | --- | :-: | :-: | :-: |
| Dashboard | `dashboard:view` | ✅ | ✅ | ✅ |
| Players | `player:write` (เข้าดูได้ทุก role, แก้ต้องมีสิทธิ์) | ✅ | ✅ | 👁 read-only |
| Matches | `match:write` (เข้าดูได้, แก้ต้องมีสิทธิ์) | ✅ | ✅ | 👁 read-only |
| Club | `club:edit` | ✅ | ✅ | ❌ ซ่อน |
| Users | `user:manage` | ✅ | ❌ ซ่อน | ❌ ซ่อน |

- **VIEWER:** เห็น Dashboard/Players/Matches แบบ **read-only** (ปุ่ม create/edit/delete ถูกซ่อน; ปฏิทินเปิด detail sheet ได้แต่ไม่มีปุ่ม action). เมนู Club/Users หายจาก nav ทั้งหมด.
- Gate ทำ **2 ชั้น**: (1) `layout.tsx`/`page.tsx` เช็ค `can()` แล้ว redirect/404 ถ้าไม่มีสิทธิ์เข้า; (2) nav component render เฉพาะเมนูที่ `can()` = true.

---

## 3. Design Tokens & Component Inventory

Dark-theme-only. ทุก token ยกมาจาก component จริงของหน้า public (TopBar, StatBadge, MatchScheduleTimeline, globals.css) เพื่อความเป็นผลิตภัณฑ์เดียวกัน.

### 3.1 Foundation tokens

| Token | ค่า | ใช้ที่ |
| --- | --- | --- |
| `--admin-bg` | `#08110c` | body พื้นหลัง |
| ambient glow | `radial-gradient(circle at 20% 10%, rgba(56,189,248,0.22), transparent 60%)` | overlay หลังทั้งเพจ |
| `.pitch-bg` | `url("/bg/stadium.png")` cover center | (optional) พื้นหลัง shell |
| surface-1 | `bg-[#0a1222]/80` | card/panel หลัก, sheet |
| surface-2 | `bg-[#0b1224]/60` | nested card, list row |
| surface-gradient | `bg-linear-to-br from-white/8 via-white/4 to-transparent` | list item, chip |
| border | `border border-white/10` + `ring-1 ring-white/10` | ทุก surface |
| radius | `rounded-2xl` (card ย่อย/ปุ่ม) · `rounded-3xl` (panel ใหญ่/sheet) · `rounded-full` (pill/avatar) | — |
| glass | `.glass-panel` = `backdrop-filter: blur(10px)` · `backdrop-blur-2xl` (sheet/overlay) | — |
| glow-ring | `.glow-ring` (box-shadow ฟ้า) | active/focus emphasis |
| shadow-lg | `shadow-[0_22px_60px_rgba(0,0,0,0.45)]` | panel/sheet |
| shadow-md | `shadow-[0_12px_30px_rgba(0,0,0,0.35)]` | card, button |
| shadow-pop | `shadow-[0_20px_50px_rgba(0,0,0,0.45)]` | dialog/popover |
| accent primary | sky `rgba(56,189,248)` · blue `rgba(37,99,235)` | ปุ่มหลัก, active, focus |
| font | Geist Sans (`--font-geist-sans`) · Geist Mono (`--font-geist-mono` — เลข/เวลา/score) | — |

**Text scale:** `text-white` (heading/value) · `text-white/70` (body) · `text-white/60` (secondary) · `text-white/50` (**decorative/eyebrow เท่านั้น** — ห้ามใช้กับข้อมูลสำคัญ, contrast ต่ำ).
**Eyebrow:** `text-[10px] uppercase tracking-[0.24em] text-white/50` (label หมวด).

### 3.2 Semantic tones (จาก StatBadge) → admin mapping

| Tone | สี | map ในแอดมิน |
| --- | --- | --- |
| **success / emerald** | `bg-emerald-500/15 text-emerald-200 ring-emerald-400/30` | Win, active user, PLAYED-Win, save success, "Mark as played" |
| **info / blue** | `bg-blue-500/15 text-blue-100 ring-blue-400/30` | Draw, **SCHEDULED**, informational toast, สถานะ pending |
| **danger / rose** | `bg-rose-500/15 text-rose-200 ring-rose-400/30` | Loss, delete, deactivate, error toast, validation error |
| **neutral** | `bg-white/5 text-white ring-white/15` | ค่ากลาง, chip เฉย ๆ |

### 3.3 Component inventory (admin usage)

| Component | สเปคย่อ (mobile default) |
| --- | --- |
| **Button — primary** | `rounded-2xl bg-sky-500/90 hover:bg-sky-400 text-[#08110c] font-semibold px-4 h-12` (h-12 = 48px, ≥44). full-width ในฟอร์ม/sheet |
| **Button — secondary** | `rounded-2xl border border-white/10 bg-white/5 text-white hover:border-white/30 h-12` |
| **Button — danger** | `rounded-2xl border border-rose-400/30 bg-rose-500/15 text-rose-200 hover:bg-rose-500/25 h-12` |
| **Button — ghost/icon** | `h-11 w-11 rounded-full hover:bg-white/5` (≥44) |
| **FAB** (Matches) | `fixed right-4 bottom-[76px] h-14 w-14 rounded-full bg-sky-500 shadow-pop glow-ring` เหนือ bottom-nav, safe-area aware |
| **Input / textarea** | `h-12 rounded-2xl border border-white/10 bg-[#0b1224]/60 px-4 text-base text-white placeholder:text-white/40 focus:ring-2 focus:ring-sky-400/60`. **`text-base` (16px) กัน iOS zoom**. native types: `type=date/time/number/tel/email` |
| **Select → bottom-sheet** | บนมือถือ ห้าม `<select>` จิ๋ว — แตะ field เปิด **bottom-sheet list** (option ≥48px/แถว, มี search ถ้า >8 ตัว). md+ ใช้ Popover/DropdownMenu |
| **Card (list item)** | `rounded-2xl border border-white/10 surface-gradient p-4 shadow-md` — หน่วยหลักของ list บนมือถือ |
| **Status chip** | pill `rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.24em]` + semantic tone (§3.2) |
| **Table → card (responsive)** | `<md`: card list · `md+`: `<table>` จริง (ดู §3.4) |
| **Calendar day cell** | ปุ่ม `aspect-square rounded-xl`; มีนัด → dot sky-300 (SCHEDULED) / emerald (PLAYED); วันนี้ → ring sky; เลือก → `bg-sky-500/20` |
| **Event chip** (calendar/agenda) | `rounded-lg surface-gradient px-2 py-1 text-xs` + tone: SCHEDULED=blue, PLAYED-Win=emerald, Loss=rose, Draw=blue |
| **Sheet (bottom)** | `fixed inset-x-0 bottom-0 rounded-t-3xl bg-[#0a1222]/95 backdrop-blur-2xl ring-1 ring-white/10 shadow-lg`; drag-handle บนสุด; full-height สำหรับฟอร์มยาว; safe-area padding ล่าง |
| **Dialog (md+)** | centered `max-w-lg rounded-3xl` glass panel + overlay `bg-black/60 backdrop-blur-sm` |
| **Toast (Sonner)** | มุมล่าง (มือถือ) / บนขวา (desktop); success=emerald, error=rose, info=blue; auto-dismiss 4s, error มีปุ่ม "ลองใหม่/undo" |
| **Skeleton** | `animate-pulse rounded-2xl bg-white/5`; ใช้ shape เดียวกับ card/table row จริง |
| **Empty state** | icon เบา + eyebrow + ประโยคชวน + primary CTA (เช่น "ยังไม่มีนัด — + เพิ่มนัดแรก") |
| **Sticky action bar** | `sticky bottom-0` ในฟอร์ม/sheet: `bg-[#0a1222]/95 backdrop-blur border-t border-white/10 p-3` + safe-area; ปุ่ม Save เต็มความกว้าง |

### 3.4 Table → Card responsive pattern (สำคัญ)

**กฎ: data table ไม่เวิร์กบนมือถือ.** ทุก list (Players / Matches history / Users) ต้อง:

- **`<md` (มือถือ):** render เป็น **card/list** — 1 การ์ดต่อ 1 record, ข้อมูลเรียงแนวตั้ง, action ผ่านปุ่มบนการ์ดหรือ overflow `⋯` (เปิด action bottom-sheet). **ห้าม** horizontal scroll ตาราง.
- **`md+`:** render เป็น `<table>` จริง (sticky header, sortable, hover row, action ในคอลัมน์ขวาสุด).
- ใช้ **แหล่งข้อมูลเดียว** render สองแบบ (`hidden md:block` / `md:hidden`) หรือ hook `use-*-column.tsx` สำหรับตารางกับ card mapper ร่วมกัน.

---

## 4. Screen-by-Screen Specs

รูปแบบแต่ละหน้า: **Purpose · Mobile layout (wireframe ถ้าจำเป็น) · Desktop adaptation · Key components · States · Validation · RBAC gate**.

### 4.1 Login (`/login`)

- **Purpose:** เข้าสู่ระบบผ่าน Auth.js Credentials (email + password) แล้ว redirect `/admin`.
- **Mobile:** single-column กลางจอ; card glass `max-w-sm` — ครุฑ/ชื่อสโมสร, eyebrow "Admin", field Email (`type=email inputmode=email autocomplete=username`), Password (`type=password autocomplete=current-password`, toggle 👁), ปุ่ม Sign in เต็มความกว้าง h-12. ไม่มี bottom-nav ในหน้านี้.
- **Desktop:** card เดิม centered บน `.pitch-bg`; อาจมี split hero ซ้าย.
- **States:** idle · submitting (ปุ่ม spinner, disable) · error (`INVALID_CREDENTIALS` → inline rose ใต้ฟอร์ม, ไม่บอกว่า email หรือ password ผิดเพื่อความปลอดภัย) · rate-limited (แจ้ง "ลองใหม่ใน N วินาที").
- **Validation (Zod):** email format, password ไม่ว่าง. server: verify argon2 + `isActive`.
- **RBAC:** ไม่มี gate (หน้าเปิด); แต่ user `isActive=false` → login fail.

### 4.2 Admin shell / layout (`(admin)/admin/layout.tsx`)

- **Purpose:** guard (login + `dashboard:view`) + โครง nav + ambient background + toast provider + role context.
- **Mobile:** top bar (52px sticky) + `<main>` scroll + **bottom tab bar** (§2.2). พื้นหลัง `#08110c` + ambient glow + optional `.pitch-bg`. `<Toaster>` (Sonner) mount ที่นี่.
- **Desktop (md+):** sidebar ซ้าย `w-64` (collapsible `w-16`) + top bar + main `md:ml-64`.
- **Key components:** `AdminTopBar`, `AdminBottomNav`, `AdminSidebar`, `RoleContext` provider (ส่ง `role` + `can()` ลง client), `<Toaster/>`.
- **States:** ระหว่าง auth check → route-level guard (server) redirect ก่อน render, ไม่มี flash.
- **RBAC:** ไม่มี `dashboard:view` → redirect `/login` (ไม่ควรเกิดเพราะทุก role มี); ยังไม่ login → middleware redirect.

**ASCII — mobile shell:**
```
┌───────────────────────────────────┐
│ ⬡ Bester FC · Admin        (AV)   │ 52px top bar (avatar ขวา)
├───────────────────────────────────┤
│                                   │
│      « page content scrolls »     │
│                                   │
├───────────────────────────────────┤
│ 🏠   👥   📅   ⚙️   ⋯             │ bottom tab (56px + safe-area)
└───────────────────────────────────┘
```

### 4.3 Dashboard (`/admin`)

- **Purpose:** สรุปภาพรวม + ทางลัด. ทุก role เข้าได้.
- **Mobile:** เรียงแนวตั้ง:
  1. Greeting + role chip
  2. **Stat grid 2×2** ใช้ StatBadge tone: Matches played · Win/Draw/Loss · Goals (GF−GA=GD) · Players count (derive จาก Match ตาม migration-spec §4.2)
  3. **Next fixture card** (นัดถัดไป SCHEDULED ที่ใกล้สุด) + countdown mini + ปุ่ม "ดูปฏิทิน"
  4. **Recent results** 3 นัดล่าสุด (PLAYED) เป็น card list
  5. Quick actions (แสดงตามสิทธิ์): + เพิ่มนัด · + เพิ่มผู้เล่น
- **Desktop:** grid `md:grid-cols-2 lg:grid-cols-4` สำหรับ stat, สองคอลัมน์สำหรับ next fixture / recent.
- **States:** loading = skeleton grid; empty (ยังไม่มี match) = "ยังไม่มีข้อมูลการแข่ง"; error = error card + retry.
- **RBAC:** `dashboard:view` (ทุก role). Quick action ซ่อนถ้าไม่มี `match:write`/`player:write`.

### 4.4 Players (`/admin/players`)

- **Purpose:** CRUD ผู้เล่น + stat aggregate (name, matchesPlayed, goals, assists, cleanSheets, sortOrder).
- **Mobile layout (card list):**
  - Header: title + count + ปุ่ม `+ Player` (ถ้ามีสิทธิ์) ; search field (filter ชื่อ) ; ปุ่ม sort/reorder
  - แต่ละผู้เล่น = **card**: ชื่อ (bold) + stat chips (G/A/MP/CS mono) + `⋯` overflow (Edit / Delete)
  - reorder: ปุ่ม "จัดลำดับ" → โหมด drag handle (`sortOrder`) — optional เฟสแรกใช้ปุ่มขึ้น/ลง
- **Desktop (md+):** `<table>`: Name · MP · Goals · Assists · CS · Sort · Actions (Edit/Delete). sortable header.
- **Form (create/edit) — bottom-sheet (mobile) / dialog (desktop):**
  - single-column: Name (text, required) · Matches played · Goals · Assists · Clean sheets (ทั้งหมด `type=number inputmode=numeric min=0`) · Sort order
  - sticky Save bar ล่าง sheet (Save primary + Cancel)
  - inline validation ใต้แต่ละ field
- **Delete:** ปุ่ม Delete → **confirm bottom-sheet** (ไม่ใช่ hover): "ลบ {ชื่อ}? การกระทำนี้ย้อนกลับไม่ได้" + ปุ่ม danger "ลบ" / secondary "ยกเลิก". optimistic: การ์ดหาย + toast "ลบแล้ว · เลิกทำ".
- **Validation (Zod):** name required + unique per club (`@@unique([clubId,name])` → server คืน `NAME_TAKEN` → inline error); ตัวเลข ≥ 0 integer.
- **States:** loading skeleton cards · empty ("ยังไม่มีผู้เล่น — เพิ่มคนแรก") · error toast · success toast emerald.
- **RBAC:** view = ทุก role; create/edit/delete gate `player:write` → VIEWER เห็น card แบบ read-only, ปุ่ม `+`/`⋯` ถูกซ่อน. server action `assert(role,"player:write")`.

**ASCII — mobile Players card list:**
```
┌───────────────────────────────────┐
│ Players · 14            [+ Player] │
│ ┌───────────────────────────────┐ │
│ │ 🔍 ค้นหาผู้เล่น            [⇅] │ │
│ └───────────────────────────────┘ │
│ ┌───────────────────────────────┐ │
│ │ Somchai P.               [⋯]  │ │
│ │ G 9 · A 4 · MP 11 · CS 0      │ │
│ └───────────────────────────────┘ │
│ ┌───────────────────────────────┐ │
│ │ Anan K.                  [⋯]  │ │
│ │ G 6 · A 7 · MP 11 · CS 0      │ │
│ └───────────────────────────────┘ │
│                ...                │
└───────────────────────────────────┘
```

### 4.5 Matches — Google Calendar UX (`/admin/matches`)  ★ หน้าหลัก

รวม schedule (SCHEDULED) + history (PLAYED) เป็นพื้นผิวเดียว แยกด้วย `status`. ต้องรู้สึกเหมือน Google Calendar และ **round-trip กับ `MatchScheduleTimeline` public** (field: `month, week label, date, opponent, venue, field, kickoff string, notes`).

#### 4.5.1 Calendar surface & view toggle

- **Default (มือถือ) = Agenda / Schedule list** — upcoming fixtures group ตาม **เดือน → สัปดาห์** (ตรงกับ public ที่ group by month/week). PLAYED แสดงย้อนหลังในโหมด "Past".
- View toggle (segmented, บน header): **Agenda** · **Month** (grid). **Week** view เปิดเฉพาะ **md+** (มือถือแคบไป).
- **Month grid:** day cell มี **dot/chip**: sky-300 = SCHEDULED, emerald = PLAYED-Win, rose = Loss, blue = Draw. วันนี้ = ring sky. แตะวัน → เปิด create-sheet (ถ้าว่าง) หรือ list mini ของวันนั้น.
- Filter chip แถวบน: All · Scheduled · Played (default Agenda = Upcoming/Scheduled).
- **FAB `+`** ขวาล่าง (เหนือ bottom-nav) → create-event sheet (default วันที่ = วันที่โฟกัส/วันนี้).

#### 4.5.2 Create-event bottom-sheet (map → Match) ★

แตะวัน หรือ FAB `+` → **full-height bottom-sheet** ที่เลียนแบบฟอร์มสร้าง event ของ Google Calendar. Field mapping:

| UI field (Google-Calendar style) | Match field | หมายเหตุ |
| --- | --- | --- |
| **Title** = "vs {opponent}" | `opponent` | ใส่ชื่อคู่แข่ง (พิมพ์ "vs" ให้อัตโนมัติในหัวข้อ) |
| **Date** (date picker) | `date` (DateTime) | native `type=date` (มือถือ) / Calendar popover (desktop) |
| **Time range** start–end | `kickoff` string | 2 native `type=time` → รวมเป็น `"18:00–20:00"` (en-dash) เพื่อ round-trip. `date` เก็บ start เป็นเวลาเตะจริง |
| **All-day / TBD time** toggle | `kickoff=null` | เปิด → ซ่อน time range, kickoff = null (แสดง "TBD" บน public) |
| **Location** = Venue + Field | `venue`, `field` | 2 field (venue required-ish, field optional). แนะนำ select→sheet จากค่าที่เคยใช้ + พิมพ์เองได้ (free-text ตาม migration-spec) |
| **Matchweek** label | `matchweek` | **auto-suggest จาก date** (คำนวณ "Week N" จาก reference/ISO week) แต่ **แก้ได้**; เก็บเป็น label string ("Week 2") |
| **Repeat** | (สร้างหลาย row) | ดู §4.5.3 recurrence |
| **Notes** | `notes` | textarea |

- **Month** field ของ public (`"Jan 2026"`) → **derive จาก `date`** ตอนสร้าง DTO (ไม่ต้องกรอก) เพื่อคง grouping ของ timeline.
- Layout single-column, sticky "Save" bar ล่าง (Save primary + ปุ่มปิด ✕ บนสุด). inline validation.
- **Motion:** slide-up spring (Framer Motion), respect reduced-motion.

**ASCII — create-event bottom-sheet (mobile, full-height):**
```
┌───────────────────────────────────┐
│           ▁▁▁ (drag handle)        │
│ ✕                      New fixture │
│ ┌───────────────────────────────┐ │
│ │ vs |No Doubt__________________│ │  Title → opponent
│ └───────────────────────────────┘ │
│ 📅  Sat 10 Jan 2026            ›   │  date (native)
│ 🕒  18:00  –  20:00                │  time range → kickoff
│     [ ◻ All-day / TBD time ]       │
│ 📍  Venue |Playmaker___________ ›  │  venue
│     Field |Field 3_____________ ›  │  field
│ #   Matchweek |Week 2   (auto) ✎  │  matchweek auto-suggest
│ 🔁  Repeat |Weekly on Sat → ...  › │  recurrence (§4.5.3)
│ 📝  Notes |____________________    │
│                                   │
├───────────────────────────────────┤
│           [   Save fixture   ]    │ sticky save bar + safe-area
└───────────────────────────────────┘
```

#### 4.5.3 Recurrence (weekly) ★

แมตช์เตะรายสัปดาห์ → รองรับ "Repeat weekly" แบบ Google Calendar.

- **Create UI:** field Repeat → sheet เลือก: **Does not repeat** / **Weekly on {weekday}** (auto = weekday ของ date) / **Custom** (ทุก N สัปดาห์). + **Until {end date}** (date picker) หรือ "จำนวนครั้ง".
- **Server behavior:** create action สร้าง **หลาย `Match` rows** (หนึ่งต่อ occurrence, `date`+7 วันต่อครั้ง จนถึง until). matchweek auto-เพิ่มทีละสัปดาห์ (แก้รวมทีหลังได้).
- **Series identity:** ต้องมี **`seriesId`** (nullable) บน Match เพื่อจัดกลุ่มชุด recurrence → **flag ไปที่ migration-spec** (§6 ของเอกสารนี้). ถ้ายังไม่มี field: fallback แบบ soft = จับกลุ่มด้วย (opponent + weekday + kickoff) — เปราะ, **ไม่แนะนำ**.
- **Edit/Delete scope prompt** (เมื่อ record อยู่ในชุด) — เลียน Google Calendar, เป็น **radio ใน bottom-sheet**:
  - ○ **This event** (แก้/ลบเฉพาะนัดนี้ — ถ้าแก้ = แตกออกจากชุด/ตั้ง `seriesId=null` หรือ override)
  - ○ **This and following** (นัดนี้เป็นต้นไป — apply กับ occurrence ที่ `date ≥` นัดนี้ ในชุดเดียวกัน)
  - ○ **All events** (ทั้งชุด `seriesId` เดียวกัน)
  - default = "This event". ปุ่มยืนยันเปลี่ยน label ตาม scope ("ลบ 1 นัด" / "ลบ 6 นัด").

#### 4.5.4 Event detail sheet + Mark as played ★

แตะ fixture ที่มีอยู่ (agenda item / calendar chip) → **detail bottom-sheet**:

- แสดง read-only: vs opponent, date, kickoff (หรือ TBD), venue·field, matchweek, notes, status chip (SCHEDULED=blue / PLAYED=emerald·rose·blue ตาม result).
- Actions: **Edit** (เปิด create-sheet โหมดแก้ + scope prompt ถ้าเป็นชุด) · **Delete** (confirm sheet + scope) · **✅ Mark as played**.
- **Mark as played** (เฉพาะ SCHEDULED) — **bridge schedule → history ในโฟลว์เดียว**:
  - แตะ → sheet เผย **score fields**: Goals for / Goals against (`type=number inputmode=numeric min=0`) → คำนวณ `result` (WIN/DRAW/LOSS) อัตโนมัติจากสกอร์ แต่ override ได้ (segmented Win/Draw/Loss).
  - Save → server action set `status=PLAYED`, `goalsFor/goalsAgainst/result`. optimistic: chip เปลี่ยนเป็น emerald/rose + toast; นัดหลุดจาก "Upcoming" ไปอยู่ "Past/Played" และ `revalidatePath("/")` ให้ public timeline (ซึ่งซ่อนนัดที่ผ่านแล้ว) + history table อัปเดต.
  - reverse ("Mark as scheduled") = optional, มีปุ่มเล็กในโหมดแก้เผื่อกดพลาด.

**ASCII — event detail sheet (mobile):**
```
┌───────────────────────────────────┐
│           ▁▁▁                      │
│ ✕                         Fixture │
│  ● SCHEDULED                      │  status chip (blue)
│  vs No Doubt                      │
│  📅 Sat 10 Jan 2026 · 🕒 18:00–20:00│
│  📍 Playmaker · Field 3           │
│  #  Week 2                        │
│  📝 —                             │
├───────────────────────────────────┤
│  [ ✅ Mark as played ]            │ primary (SCHEDULED เท่านั้น)
│  [ ✎ Edit ]        [ 🗑 Delete ]  │ secondary / danger
└───────────────────────────────────┘
       ↓ กด "Mark as played"
┌───────────────────────────────────┐
│  Score                            │
│  Bester  [ 3 ]  –  [ 1 ]  No Doubt│  number inputs
│  Result: ( Win )  Draw   Loss     │  auto จากสกอร์, override ได้
│  [   Save result   ]              │ → status=PLAYED
└───────────────────────────────────┘
```

#### 4.5.5 Desktop adaptation

- **Month grid** เต็มจอเป็น default (7 คอลัมน์), fixture เป็น **block** ในช่องวัน (opponent + kickoff, สี tone). **Week view** เปิดได้ (lg+) — คอลัมน์รายวัน + time-slot.
- คลิกวัน/slot ว่าง → เปิด **create form เป็น centered Dialog** (ฟอร์มเดียวกับ bottom-sheet, layout เหมือนกัน).
- คลิก block → detail **Dialog** (เนื้อหาเดียวกับ detail sheet).
- **Drag-to-reschedule:** *optional/nice-to-have* — ลาก block ไปวันอื่นเพื่อเปลี่ยน `date` (อัปเดต optimistic). ไม่บังคับเฟสนี้.

- **States (ทั้งหน้า):** loading = skeleton agenda/calendar; empty = "ยังไม่มีนัด — + เพิ่มนัดแรก"; error toast; recurrence สร้างสำเร็จ → toast "สร้าง 6 นัด".
- **Validation (Zod):** opponent required; date required (valid); ถ้าไม่ all-day → start < end; matchweek optional string; PLAYED → goalsFor/goalsAgainst required ≥0 + result สอดคล้อง (server derive/verify).
- **RBAC:** view ทุก role (read-only สำหรับ VIEWER — เห็นปฏิทิน/detail แต่ไม่มี FAB/Edit/Delete/Mark). create/edit/delete/mark gate `match:write`; server `assert(role,"match:write")`.

**ASCII — mobile Agenda view (default):**
```
┌───────────────────────────────────┐
│ Matches      [Agenda] Month       │  view toggle
│ ( Upcoming ) Scheduled  Played    │  filter chips
├───────────────────────────────────┤
│ ● Jan 2026                        │  month header (sky dot)
│ │ Week 2                          │  week sub-group
│ │ ┌───────────────────────────┐   │
│ │ │ Sat 10 · 18:00–20:00      │   │  ← fixture card (tap→detail)
│ │ │ vs No Doubt   Playmaker·F3│   │
│ │ │ ● SCHEDULED               │   │  blue chip
│ │ └───────────────────────────┘   │
│ │ Week 3                          │
│ │ ┌───────────────────────────┐   │
│ │ │ Sat 17 · 18:00–20:00      │   │
│ │ │ vs Azura FC   Playmaker·F1│   │
│ │ └───────────────────────────┘   │
│ ● Feb 2026                        │
│ │ ...                             │
│                             ( + ) │  FAB (เหนือ bottom-nav)
└───────────────────────────────────┘
```

### 4.6 Club / Branding / SEO (`/admin/club`)

- **Purpose:** แก้ข้อมูลสโมสร + branding + SEO (ตาราง Club: name, shortName, crestUrl, facebookUrl, instagramUrl, siteUrl, seoTitle, seoDescription, seoKeywords[], ogImageUrl, themeColor). กระทบ TopBar/ClubHeader/metadata.
- **Mobile:** single-column, จัดเป็น **collapsible sections** (accordion) 3 กลุ่ม:
  1. **Identity** — name, shortName, crestUrl (+ preview ครุฑ), themeColor (color input)
  2. **Social** — facebookUrl, instagramUrl (`type=url inputmode=url`)
  3. **SEO / Metadata** — siteUrl, seoTitle, seoDescription (textarea + counter), seoKeywords (tag input → chips), ogImageUrl (+ preview การ์ด OG)
  - **sticky Save bar** ล่างจอ (form ยาว) — Save เต็มความกว้าง; **unsaved-changes guard** เมื่อจะออก.
- **Desktop:** two-column (ฟอร์มซ้าย / live preview การ์ด OG + TopBar ขวา).
- **States:** loading skeleton form; save success toast emerald + "อัปเดตหน้า public แล้ว" (`revalidatePath("/")`); error toast; dirty state → Save enabled.
- **Validation (Zod):** URL fields = valid URL หรือว่าง; seoTitle ≤ ~60, seoDescription ≤ ~160 (คำเตือน soft); themeColor = hex; keywords = array trim ไม่ซ้ำ.
- **RBAC:** gate `club:edit` (ADMIN/EDITOR). VIEWER = เมนูซ่อน + route 404/redirect. server `assert(role,"club:edit")`.

### 4.7 Users (`/admin/users`) — ADMIN only

- **Purpose:** จัดการ user (list, create/invite, เปลี่ยน role, activate/deactivate, reset password). ADMIN เท่านั้น.
- **Mobile (card list):** แต่ละ user = card: name/email + **role chip** (ADMIN=blue, EDITOR=neutral, VIEWER=white/50) + **active chip** (active=emerald / inactive=rose) + `⋯` (Change role / Deactivate / Reset password). ปุ่ม `+ Invite`.
- **Desktop:** `<table>`: Name · Email · Role · Status · Last login · Actions.
- **Create/Invite form (sheet/dialog):** email (required, unique), name, role (select→sheet: ADMIN/EDITOR/VIEWER), temp password (หรือ generate). *(ไม่มี email delivery เฟสนี้ → แสดง temp password ให้ copy ครั้งเดียว)*.
- **Change role:** action → sheet select role → confirm (optimistic chip update).
- **Deactivate:** danger confirm sheet ("ปิดใช้งาน {email}? เข้าสู่ระบบไม่ได้จนกว่าจะเปิดใหม่") → set `isActive=false` (ไม่ลบจริง). **Guard: ห้าม deactivate/demote ADMIN คนสุดท้าย** (server ตรวจ → error `LAST_ADMIN`).
- **States:** loading skeleton; empty (ไม่ควรเกิด — มี admin เสมอ); error toast; success toast.
- **Validation (Zod):** email format+unique (server `EMAIL_TAKEN`); role ∈ enum; password ตาม policy (min length).
- **RBAC:** gate `user:manage` (ADMIN). EDITOR/VIEWER = เมนูซ่อน + route 404. server `assert(role,"user:manage")` + last-admin guard.

---

## 5. Interaction & Feedback Patterns

| Pattern | สเปค |
| --- | --- |
| **Optimistic updates** | ใช้ `useOptimistic` (React 19) + server action. UI อัปเดตทันที (การ์ดเพิ่ม/หาย, chip เปลี่ยน) ก่อน server ตอบ; fail → rollback + toast rose "บันทึกไม่สำเร็จ · ลองใหม่" |
| **Toast conventions (Sonner)** | success = **emerald** ("บันทึกแล้ว") · error = **rose** (+ ปุ่ม retry) · info = **blue** · loading/pending = spinner toast แล้ว resolve เป็น success/error. ตำแหน่ง: มือถือ bottom-center (เหนือ nav), desktop top-right |
| **Confirm sheets (delete/destructive)** | ทุก destructive ใช้ **bottom-sheet/dialog confirm** (ไม่ใช่ hover affordance): ชื่อ record + ผลลัพธ์ + ปุ่ม danger (label ชัด เช่น "ลบผู้เล่น") + cancel. ปุ่ม danger ไม่เป็น default focus |
| **Form save bar** | ฟอร์มยาว/ทุก sheet มี **sticky action bar** ล่าง (safe-area): Save primary เต็มกว้าง + Cancel. disable Save จน dirty & valid; แสดง spinner ระหว่าง submit |
| **Unsaved-changes guard** | ฟอร์ม dirty แล้วจะปิด sheet/ออก route → confirm "ทิ้งการแก้ไข?" (`beforeunload` + intercept back/close). RHF `formState.isDirty` |
| **Recurring-edit scope prompt** | ตาม §4.5.3 — ทุกครั้งที่ edit/delete record ที่มี `seriesId` → sheet radio (This / This and following / All) ก่อน apply |
| **Inline validation** | RHF + Zod resolver, validate on blur/submit; error text rose ใต้ field + `aria-invalid` + border rose |
| **Pending / disabled** | ปุ่ม submit ระหว่าง pending → spinner + `aria-busy` + กันกดซ้ำ (idempotent). ทั้ง sheet lock scroll |

---

## 6. Accessibility

- **Focus states บนพื้นมืด:** `focus-visible:ring-2 ring-sky-400/70 ring-offset-2 ring-offset-[#08110c]` ทุก interactive — ต้องเห็นชัดบน dark bg (ห้ามพึ่ง color อย่างเดียว).
- **Contrast:** ข้อมูลสำคัญใช้ `text-white`/`white/70` (ผ่าน AA); **`white/50` ใช้กับ decorative/eyebrow เท่านั้น** ห้ามใส่ค่าที่ต้องอ่าน. semantic chip ใช้เฉด `-200`/`-100` บนพื้น `/15` (contrast พอ) + ไม่สื่อความหมายด้วยสีอย่างเดียว (มี label/icon กำกับ WIN/DRAW/LOSS).
- **Tap targets ≥ 44px:** ปุ่ม h-12 (48), icon button 44, bottom-nav 56, option row ≥48. ระยะห่างปุ่ม ≥8px.
- **Keyboard nav:** tab order สมเหตุผล; sheet/dialog = **focus trap** + `Esc` ปิด + คืน focus ไป trigger; bottom-nav = arrow-navigable; calendar grid = `role="grid"` + arrow keys เลื่อนวัน, Enter เปิดวัน.
- **ARIA:** sheet/dialog = `role="dialog" aria-modal="true" aria-labelledby`; confirm = `role="alertdialog"`; toast = `role="status"`/`aria-live="polite"` (error = `assertive`); select→sheet = `role="listbox"`/`option`; calendar = `role="grid"`, cell `aria-selected`/`aria-label="10 January, 1 fixture"`; status chip มี `aria-label` เต็ม ("Scheduled").
- **Reduced motion:** เคารพ `prefers-reduced-motion` — Framer Motion `useReducedMotion()` (มีใช้แล้วใน MatchScheduleTimeline) ปิด slide/stagger; `.fade-in-up` มี guard อยู่แล้ว. sheet ยังเปิด/ปิดได้แต่ไม่มี spring.
- **Forms:** `<label>` ผูกทุก input; native input type ให้ mobile keyboard/picker ถูกต้อง; error ผูก `aria-describedby`.
- **Screen size / zoom:** input `text-base` (16px) กัน iOS auto-zoom; รองรับ text zoom 200%.

---

## 7. Responsive Breakpoints (Tailwind defaults)

| BP | width | Navigation | Lists (Players/Users/History) | Calendar |
| --- | --- | --- | --- | --- |
| **base** | 0–639 | **Bottom tab bar** + top bar; drawer secondary | **Card list** (ห้าม table) | **Agenda** default; Month grid toggle (dot ต่อวัน); FAB `+`; sheet ฟอร์ม |
| **sm** | ≥640 | เหมือน base (ยังมือถือ) — card กว้างขึ้น, 2-col chip | Card list (การ์ดใหญ่ขึ้น) | Agenda + Month; ยังใช้ sheet |
| **md** | ≥768 | **Sidebar** (`w-64`/rail `w-16`) แทน bottom-nav; top bar คงไว้ | **Table** จริง (sticky header, sortable, action column) | Month grid เป็น default; ฟอร์ม/detail เป็น **Dialog**; เริ่มมี **Week view** |
| **lg** | ≥1024 | Sidebar ขยาย + labels; content max-w container | Table + filters/pagination เต็ม | Month + **Week** เต็มรูป; block fixtures; drag-to-reschedule (optional) |

**การแปลงร่างหลัก:** (1) nav: bottom-tab → sidebar ที่ `md`; (2) list: card → table ที่ `md`; (3) calendar: agenda(base) → month(md) → +week(lg); (4) overlay: bottom-sheet(base) → centered dialog(md).

---

## 8. Build Order / Task Checklist (slot เข้า migration-spec Phase 3)

migration-spec Phase 3 = "Admin CRUD". เอกสารนี้แตกย่อยลำดับ UI:

**3.0 — Shared UI primitives (ทำก่อนทุกฟีเจอร์)**
- [ ] Design tokens → utility/CSS (`globals.css`: admin bg, ambient glow, reuse `.glass-panel`/`.glow-ring`)
- [ ] ตัดสิน shadcn/ui vs hand-rolled (§9) → ถ้าใช้ shadcn: `init` + re-theme ตาม token; ติดตั้ง Button, Input, Form, Sheet, Dialog, DropdownMenu, Table, Sonner, Calendar, Popover
- [ ] Primitive: `Button` (primary/secondary/danger/icon), `Field`/`Input`/`Textarea`, `SelectSheet` (select→bottom-sheet), `Card`, `StatusChip`, `Sheet`/`Dialog` wrapper, `ConfirmSheet`, `Toaster` (Sonner), `Skeleton`, `EmptyState`, `StickyActionBar`
- [ ] `AdminShell`: top bar + `BottomNav` + `Sidebar` + `RoleContext` (`can()` client)
- [ ] `ResponsiveList` pattern (card `<md` / table `md+`) + hook columns

**3.1 — Auth surface**
- [ ] `/login` page + form (RHF+Zod) + error/rate-limit states

**3.2 — Shell & Dashboard**
- [ ] `(admin)/layout.tsx` guard + shell; Dashboard (stat grid, next fixture, recent results, quick actions)

**3.3 — Players** (`player:write`)
- [ ] List (card/table) + search + reorder; `PlayerForm` sheet/dialog; delete confirm; optimistic + toast; server action `upsertPlayer`/`deletePlayer` (RBAC)

**3.4 — Calendar module** (`match:write`) ★ ก้อนใหญ่สุด — วางเป็น sub-tasks:
- [ ] `MatchCalendar` shell + view toggle (Agenda/Month, Week@md)
- [ ] `AgendaList` (group month→week, ใช้ logic เดียวกับ public timeline)
- [ ] `MonthGrid` (react-day-picker) + day dots + tap handlers
- [ ] `EventCreateSheet` (map fields + matchweek auto-suggest + kickoff range → string + all-day toggle)
- [ ] `RecurrenceControl` (weekly/until) + server สร้างหลาย row (ต้องมี `seriesId` — ดู §9)
- [ ] `EventDetailSheet` + `MarkAsPlayed` (เผย score → status transition)
- [ ] Scope prompt (This / following / all) สำหรับ edit/delete series
- [ ] Desktop Dialog variants + (optional) drag-to-reschedule
- [ ] server actions: `upsertMatch`, `createRecurringMatches`, `markMatchPlayed`, `deleteMatch(scope)` — ทั้งหมด `revalidatePath("/")` + `/admin/matches`

**3.5 — Club/Branding/SEO** (`club:edit`)
- [ ] `ClubForm` (accordion sections + previews) + sticky save + unsaved guard; action `updateClub` + `revalidatePath("/")`

**3.6 — Users** (`user:manage`, ADMIN)
- [ ] List (card/table); `UserForm` (invite/create); change role; deactivate (confirm); last-admin guard; actions RBAC

**3.7 — Polish**
- [ ] Empty/loading/error ทุกหน้า; a11y pass (focus, aria, reduced-motion); optimistic rollback; safe-area/44px audit บนอุปกรณ์จริง

---

## 9. Open Decisions & Recommendations

| ประเด็น | ตัวเลือก | **คำแนะนำ** |
| --- | --- | --- |
| **shadcn/ui vs hand-rolled** | (a) hand-roll ตามหน้า public; (b) shadcn/ui สำหรับ admin | **ใช้ shadcn/ui สำหรับ admin เท่านั้น** — Form/Dialog/Sheet/DropdownMenu/Table/Sonner/Calendar+Popover ให้ a11y (focus trap, aria, keyboard) + mobile-friendly ฟรี ซึ่งการ hand-roll ให้ถูกต้องแพงมาก. **เงื่อนไข:** re-theme เป็น token §3 (dark glass, rounded-2xl/3xl, sky accent) — โค้ด own ได้อยู่แล้ว. หน้า public **คงไว้ hand-written** ไม่แตะ. |
| **Calendar library** | (a) FullCalendar/heavy; (b) **react-day-picker** (shadcn Calendar) + custom agenda; (c) hand-roll grid | **(b) react-day-picker (shadcn `<Calendar>`) สำหรับ Month grid + custom `AgendaList`/`WeekView` ที่เขียนเอง.** bundle เล็ก, headless-ish, a11y grid มาแล้ว. FullCalendar หนักเกินสำหรับ mobile bundle และ theme ยาก. Agenda (โหมดหลักมือถือ) reuse logic group month/week จาก public timeline อยู่แล้ว. |
| **Toast library** | Sonner vs custom | **Sonner** — mobile-friendly, promise-based (`toast.promise`), themable, a11y `aria-live`. map tone emerald/rose/blue. |
| **Mobile date/time picker** | native input vs JS picker | **native `type=date`/`type=time`** บนมือถือ (OS picker คุ้นมือ, a11y ฟรี, bundle 0). desktop ใช้ shadcn Calendar popover สำหรับ date. kickoff = 2 native time → join เป็น `"HH:MM–HH:MM"`. |
| **Recurrence data model** | soft-group vs field | **ต้องเพิ่ม field ใน Match** — recommend `seriesId String?` (+ `@@index([seriesId])`) เพื่อ group ชุด recurrence และรองรับ scope "this / following / all" อย่างเชื่อถือได้. (option: เพิ่ม `recurrenceRule String?` เก็บ RRULE ถ้าจะทำ pattern ซับซ้อน — เฟสนี้ไม่จำเป็น, generate rows พอ). |

### 9.1 ★ ข้อเสนอแก้ migration-spec

> **แนะนำเพิ่มใน `migration-spec.md` §2 (model `Match`):**
> ```prisma
> seriesId   String?   // จัดกลุ่มนัดที่สร้างจาก recurrence เดียวกัน (weekly series)
> @@index([seriesId])
> ```
> เหตุผล: การ์ดสร้างนัดแบบ Google-Calendar recurrence ("Repeat weekly until …") จะ generate หลาย `Match` rows; ต้องมี key จับกลุ่มเพื่อรองรับ **edit/delete scope = this / this-and-following / all** อย่างถูกต้อง. ถ้าไม่เพิ่ม จะต้อง fallback จับกลุ่มด้วย heuristic (opponent+weekday+kickoff) ซึ่งเปราะและผิดพลาดง่าย. ควร flag กลับเข้า schema ก่อนเริ่ม Phase 3.4 (Calendar module).

---

*(สิ้นสุด admin-ux-spec — ยึด data model & RBAC จาก migration-spec.md; ทุก mutation เป็น RBAC-guarded Server Action + `revalidatePath("/")`)*
