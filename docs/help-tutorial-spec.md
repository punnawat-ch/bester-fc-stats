# Spec: Help & Tutorial System (Wave 7)

> ระบบคู่มือ/สอนใช้งานใน admin portal — แบบ **Layered 3 ชั้น**
> ตัดสินใจแล้ว: **เนื้อหาภาษาไทยล้วน** · **Tour แบบ highlight-only (v1)** · **เก็บ state per-user ใน DB**

**สถานะ:** ทำหลัง Wave 5/6 (เป็นฟีเจอร์เสริม ไม่กระทบ flow เดิม) — เป็น docs-only ตอนนี้

---

## 1. เป้าหมาย
ให้คนในทีม (แอดมิน/ผู้ช่วย) เรียนรู้การใช้แต่ละเมนูได้เอง โดย:
1. **Contextual** — ปุ่ม `?` ทุกหน้า อธิบายฟีเจอร์นั้นตรงจุด
2. **Interactive tour** — ไฮไลต์ทีละจุด สอน "กดตรงไหน ทำอะไร" เปิด/ปิดได้
3. **Help hub** — คู่มือรวมทุกฟีเจอร์ที่เดียว + ค้นหา

---

## 2. Data model — เพิ่มใน `User`
```prisma
model User {
  // ...ของเดิม
  tutorialEnabled Boolean  @default(true)   // เปิด auto-tour ไหม
  toursSeen       String[] @default([])     // featureKey ที่ดูจบแล้ว (กัน auto ซ้ำ)
}
```
Migration: `pnpm prisma migrate dev --name user_tutorial_prefs` (optional/defaulted → ปลอดภัยกับ user เดิม)

---

## 3. Content architecture — TSX content modules (ไทย)
เนื้อหาเป็น **TSX modules** (typed, ไม่ต้องตั้ง MDX pipeline). ทัวร์ + help sheet + hub ใช้ **แหล่งเดียวกัน**

```
src/content/help/
  index.ts        // registry: Record<FeatureKey, HelpEntry>
  welcome.tsx     // first-login (โครงรวม + bottom-nav)
  dashboard.tsx
  players.tsx
  matches.tsx
  club.tsx
  users.tsx
```

```ts
export type FeatureKey =
  | "welcome" | "dashboard" | "players" | "matches" | "club" | "users";

export type TourStep = {
  selector: string;      // '[data-tour="players-add"]'
  title: string;         // ไทย
  description: string;    // ไทย
};

export type HelpEntry = {
  key: FeatureKey;
  title: string;                              // "จัดการผู้เล่น"
  summary: React.ReactNode;                   // ย่อ ใช้ใน HelpSheet
  sections: { heading: string; body: React.ReactNode }[]; // คู่มือเต็ม ใช้ใน hub
  tour: TourStep[];                           // highlight-only steps
};
```
> เนื้อหาทั้งหมด **ภาษาไทย**. ถ้าอนาคตอยากให้ ADMIN แก้เอง→ ย้าย registry เข้า DB ได้ (schema เดียวกัน)

### 3.1 ตัวอย่างเนื้อหาจริง — Matches (ฟีเจอร์ซับซ้อนสุด)
```tsx
// src/content/help/matches.tsx
import type { HelpEntry } from "./index";

export const matchesHelp: HelpEntry = {
  key: "matches",
  title: "จัดการตารางแข่ง",
  summary: (
    <p>
      สร้างและจัดการนัดแข่งแบบปฏิทิน — เพิ่มนัดที่จะเตะ ตั้งนัดซ้ำรายสัปดาห์
      และบันทึกผลเมื่อแข่งจบ (ผลไปคำนวณสถิติทีม/ประวัติแข่งบนหน้าเว็บอัตโนมัติ)
    </p>
  ),
  sections: [
    {
      heading: "มุมมอง Agenda และ ปฏิทินเดือน",
      body: (
        <p>
          ค่าเริ่มต้นบนมือถือคือ <b>Agenda</b> (รายการนัดจัดกลุ่มตามเดือน/สัปดาห์)
          กดปุ่มสลับด้านบนเพื่อดูแบบ <b>ปฏิทินเดือน</b> ได้ วันที่มีนัดจะมีจุดสี
          (ฟ้า = ยังไม่เตะ, เขียว = ชนะ, แดง = แพ้, น้ำเงิน = เสมอ)
        </p>
      ),
    },
    {
      heading: "เพิ่มนัดใหม่",
      body: (
        <p>
          กดปุ่ม <b>+</b> (หรือแตะวันในปฏิทิน) เพื่อเปิดฟอร์ม กรอกคู่แข่ง วัน–เวลา
          สนาม แล้วบันทึก นัดใหม่จะขึ้นสถานะ “ยังไม่เตะ” และไปโชว์ใน Match Timeline
          บนหน้าเว็บ (เฉพาะนัดที่ยังไม่ถึงเวลาเตะ)
        </p>
      ),
    },
    {
      heading: "ตั้งนัดซ้ำรายสัปดาห์",
      body: (
        <p>
          ในฟอร์มเพิ่มนัด เปิด <b>“เตะซ้ำทุกสัปดาห์”</b> แล้วเลือกวันสิ้นสุด
          ระบบจะสร้างนัดให้อัตโนมัติทุก 7 วันจนถึงวันนั้น (นัดชุดเดียวกันผูกกันไว้)
        </p>
      ),
    },
    {
      heading: "บันทึกผลเมื่อแข่งจบ",
      body: (
        <p>
          แตะที่นัด แล้วกด <b>“บันทึกผล”</b> ใส่สกอร์ ระบบสรุปผล ชนะ/แพ้/เสมอ ให้เอง
          แล้วย้ายนัดเป็น “เตะจบแล้ว” สถิติทีม (แต้ม, ประตูได้–เสีย) และตารางประวัติ
          จะอัปเดตทันที
        </p>
      ),
    },
    {
      heading: "แก้ไข / ลบ นัดที่เป็นชุด",
      body: (
        <p>
          ถ้าเป็นนัดซ้ำ ระบบจะถามขอบเขต: <b>เฉพาะนัดนี้</b> /
          <b>นัดนี้และหลังจากนี้</b> / <b>ทั้งชุด</b> เพื่อไม่ให้กระทบนัดอื่นโดยไม่ตั้งใจ
        </p>
      ),
    },
  ],
  // highlight-only: ชี้ของที่เห็นบนจอ ไม่บังคับเปิด sheet
  tour: [
    {
      selector: '[data-tour="matches-view-toggle"]',
      title: "สลับมุมมอง",
      description: "สลับระหว่างรายการ (Agenda) กับปฏิทินเดือนได้ที่นี่",
    },
    {
      selector: '[data-tour="matches-fab"]',
      title: "เพิ่มนัดใหม่",
      description: "กดปุ่มนี้เพื่อเปิดฟอร์มเพิ่มนัด — ตั้งนัดซ้ำรายสัปดาห์ได้ในฟอร์ม",
    },
    {
      selector: '[data-tour="match-item"]',
      title: "จัดการนัด",
      description: "แตะที่นัดเพื่อดูรายละเอียด แก้ไข ลบ หรือ “บันทึกผล” เมื่อแข่งจบ",
    },
  ],
};
```

### 3.2 ตัวอย่าง Welcome tour (รันครั้งแรกหลัง login) ✅
```tsx
// src/content/help/welcome.tsx
export const welcomeHelp: HelpEntry = {
  key: "welcome",
  title: "ยินดีต้อนรับสู่ Bester FC Admin",
  summary: <p>ทัวร์สั้น ๆ แนะนำเมนูหลักและวิธีเริ่มต้นใช้งาน</p>,
  sections: [
    { heading: "ภาพรวม", body: <p>ระบบหลังบ้านสำหรับจัดการทีม — ผู้เล่น ตารางแข่ง ข้อมูลสโมสร และผู้ใช้</p> },
  ],
  tour: [
    { selector: '[data-tour="nav-dashboard"]', title: "หน้าหลัก", description: "ดูภาพรวมทีม สถิติ และนัดที่กำลังจะถึง" },
    { selector: '[data-tour="nav-matches"]', title: "ตารางแข่ง", description: "เพิ่มนัด บันทึกผล จัดตารางแบบปฏิทิน" },
    { selector: '[data-tour="nav-players"]', title: "ผู้เล่น", description: "เพิ่ม/แก้ไขผู้เล่น อัปโหลดรูป และแก้สถิติ" },
    { selector: '[data-tour="nav-more"]', title: "เพิ่มเติม", description: "ตั้งค่าสโมสร จัดการผู้ใช้ และเปิดคู่มือได้ที่นี่" },
    { selector: '[data-tour="topbar-signout"]', title: "ออกจากระบบ", description: "กดที่นี่เมื่อใช้งานเสร็จ" },
  ],
};
```
> **Welcome tour = ยืนยันทำ**: รันอัตโนมัติครั้งแรกที่เข้า `/admin` (ถ้า `tutorialEnabled && !toursSeen.includes("welcome")`), เล่นซ้ำได้จากปุ่ม "เล่นทัวร์แนะนำใหม่" ใน Help hub

---

## 4. ชั้น 1 — Contextual help (`?` ทุกหน้า)
- เพิ่ม prop `helpKey?: FeatureKey` ให้ `PageHeader` (Wave 3) → ถ้ามี render ปุ่ม **`?`** (ปุ่มกลม glass, ≥44px)
- กด → เปิด **`HelpSheet`** (bottom sheet, reuse shadcn `Sheet`):
  - `title` + `summary`
  - ปุ่ม **"▶ ดูวิธีใช้ (ทัวร์)"** → `startTour(key)`
  - ปุ่ม **"📖 เปิดคู่มือเต็ม"** → `/admin/help#${key}`
- Component: `src/components/admin/help/HelpButton.tsx`, `HelpSheet.tsx`

---

## 5. ชั้น 2 — Interactive tour (driver.js, highlight-only)
เพิ่ม dep **`driver.js`** (~5KB). Highlight-only = ทัวร์ชี้ปุ่ม/ส่วนต่าง ๆ + คำอธิบาย ผู้ใช้กด "ถัดไป" เอง (ไม่พังง่ายเวลา UI เปลี่ยน)

### 5.1 กลไก
- `src/components/admin/help/tour.ts` — `startTour(key, steps)` ห่อ driver.js:
  - map `TourStep[]` → driver steps (`element: selector`, `popover: { title, description }`)
  - re-theme popover ให้เข้าธีม dark glass (override `.driver-popover*`: bg `#0b1224`, border `white/10`, ปุ่ม sky accent)
  - เคารพ `prefers-reduced-motion` → ปิด animation ของ driver
  - ปุ่มไทย: "ถัดไป / ก่อนหน้า / จบ / ข้าม"
- **`data-tour="..."` attributes** ติดบน element เป้าหมาย (ดู §7) เพื่อให้ selector เสถียร
- **Auto ครั้งแรก**: hook `useFeatureTour(key)` ในแต่ละหน้า → ถ้า `tutorialEnabled && !toursSeen.includes(key)` → `startTour` → จบแล้วเรียก `markTourSeen(key)`
- **First-login welcome tour**: `welcome` แนะนำ bottom-nav + โครงรวม รันครั้งแรกที่เข้า `/admin`
- **Replay**: จากปุ่ม `?` (HelpSheet) เสมอ แม้เคยดูแล้ว/ปิด auto

### 5.2 Mobile (สำคัญ — admin ใช้บนมือถือ)
- สเต็ปสั้น, ข้อความกระชับ, popover ไม่ล้นจอ
- ไฮไลต์ของที่ "เห็นอยู่บนจอ" (bottom-nav, FAB, ปุ่มหลัก) — **ไม่บังคับเปิด sheet** (นั่นคือเหตุผลที่เลือก highlight-only). สเต็ปที่เกี่ยวกับ sheet → อธิบายเป็นคำพูด ("กด + เพื่อเปิดฟอร์มเพิ่มนัด") ไม่ต้อง drive UI

---

## 6. ชั้น 3 — Help hub `/admin/help`
- อยู่ใน **"More"** menu (ไม่กิน slot bottom-nav) — เพิ่ม entry ใน `nav-config.ts` (moreNavItems), gate = `dashboard:view` (ทุก role เห็น)
- หน้า: 
  - **ช่องค้นหา** (client-side filter บน title/heading/เนื้อหา)
  - รายการฟีเจอร์ (accordion) render `sections` เต็มของแต่ละ `HelpEntry`
  - แต่ละหัวข้อมีปุ่ม "▶ ดูทัวร์"
  - **Master toggle** "เปิด/ปิด tutorial อัตโนมัติ" → `setTutorialEnabled(bool)`
  - ปุ่ม "เล่นทัวร์แนะนำใหม่" (reset welcome)
- Route: `src/app/admin/(dashboard)/help/page.tsx` (อยู่ในกลุ่ม guarded ปกติ)

---

## 7. State + server actions (per-user)
`src/app/admin/(dashboard)/help/action.ts` (`"use server"`, guard `requireUser()`):
- `setTutorialEnabled(enabled: boolean)` → update `User.tutorialEnabled`
- `markTourSeen(key: FeatureKey)` → push เข้า `User.toursSeen` (dedupe)
- `resetTour(key)` → เอา key ออกจาก `toursSeen` (ให้ auto ใหม่)
- อ่านค่า: ส่ง `tutorialEnabled`/`toursSeen` ผ่าน context จาก admin layout (อ่าน session user + query) → client hook ใช้ตัดสิน auto-run

---

## 8. `data-tour` attribute plan (จุดที่ต้องแปะ — highlight targets)
| Feature | selectors |
|---|---|
| welcome/shell | `nav-dashboard`, `nav-matches`, `nav-players`, `nav-more`, `topbar-signout` |
| players | `players-add`, `player-actions`, (ใน editor) `player-card-preview`, `player-stat-tiles`, `player-photo` |
| matches | `matches-fab`, `matches-view-toggle`, `match-item` |
| club | `club-branding`, `club-seo`, `club-save` |
| users | `users-invite`, `user-role` |
> การแปะ attribute แตะไฟล์ feature เดิม (players/matches/club/users/shell) — เป็น non-breaking (แค่ attribute)

---

## 9. Components inventory (สร้างใหม่)
```
src/components/admin/help/
  HelpButton.tsx      // ปุ่ม ? ใน PageHeader
  HelpSheet.tsx       // bottom sheet: summary + ปุ่มทัวร์/คู่มือ
  tour.ts             // driver.js wrapper + theme + reduced-motion
  useFeatureTour.ts   // auto-run ครั้งแรก
  TutorialToggle.tsx  // switch เปิด/ปิด
src/content/help/*    // เนื้อหาไทย (registry)
src/app/admin/(dashboard)/help/{page,action}.tsx
```
+ แก้ `PageHeader` (รับ `helpKey`), `nav-config.ts` (+ Help ใน More), แต่ละหน้า feature (แปะ `data-tour` + `useFeatureTour`)

---

## 10. Task breakdown (Wave 7)
1. Migration `User.tutorialEnabled` + `toursSeen` → generate
2. `driver.js` + theme override (dark glass) + `tour.ts` + reduced-motion
3. Content registry (ไทย) ครบ 6 features (welcome/dashboard/players/matches/club/users)
4. HelpButton + HelpSheet + เสียบ `helpKey` เข้า PageHeader ทุกหน้า
5. `useFeatureTour` auto-run + `markTourSeen` + welcome first-login
6. Help hub `/admin/help` (ค้นหา + accordion + master toggle) + More nav entry
7. แปะ `data-tour` ตาม §8
8. server actions + ส่ง prefs ผ่าน layout context
9. Verify: tsc/lint + ลองทัวร์บนมือถือ (viewport เล็ก) + reduced-motion + toggle off = ไม่ auto

---

## 11. Open / future (ยังไม่ทำ v1)
- **Interactive tour** (พา UI เปิด sheet ให้) — ยกระดับจาก highlight-only ทีหลัง
- **วิดีโอ** ในคู่มือ — ฝัง/โฮสต์ทีหลัง (production overhead)
- **DB-editable content** — ให้ ADMIN แก้เนื้อหาเอง (ย้าย registry เข้า DB)
- **หลายภาษา** — ตอนนี้ไทยล้วน; ถ้าต้องมีอังกฤษค่อยเพิ่ม i18n layer
