# Impl Spec: Sheet Tours for Players & Matches (create-only auto)

> แยกจาก `help-tutorial-spec.md` (ดู "★ Addendum 1/2" สำหรับเนื้อหา/ทัวร์)
> โฟกัส: **implement** ทัวร์ในบริบท sheet ของ Players + Matches ที่ **auto เฉพาะตอน create**

**Base ที่มีอยู่แล้ว (Wave 7):** `tour.ts` (`startTour`, skip selector ที่ไม่มีใน DOM, reduced-motion), `useFeatureTour(key)`, `<FeatureTour featureKey/>`, `TutorialPrefsProvider`/`useTutorialPrefs`, `markTourSeen`, `HelpButton`/`HelpSheet`, registry `src/content/help/*`.

---

## 0. นโยบายที่ยึด
- **Auto = create-only** ในโซน `/admin/players` + `/admin/matches`: ทัวร์ sheet เล่นเองเฉพาะตอนเปิดฟอร์ม "สร้างใหม่" ครั้งแรก
- **Edit / detail / หน้า list** → ไม่ auto มีแค่ปุ่ม **`?`** (replay)
- Guard เดิมคงไว้: `tutorialEnabled && !toursSeen.has(key)`
- ไม่แตะ welcome/dashboard (คนละโซน)

---

## 1. กลไก create-only (ใช้ร่วมทั้ง players + matches)

**A. Conditional mount ใน sheet:** render `<FeatureTour>` ก็ต่อเมื่อเป็นโหมด create เท่านั้น
```tsx
// ใน SheetContent ของฟอร์มสร้าง/แก้
const isCreate = player == null;            // matches: event == null
...
{isCreate ? <FeatureTour featureKey="player-editor" /> : null}
<HelpButton featureKey="player-editor" />   {/* อยู่ใน SheetHeader — มีทั้ง create/edit */}
```
- `FeatureTour` mount เฉพาะตอน create → `useFeatureTour` ยิง auto ครั้งแรก (guarded ด้วย toursSeen)
- `HelpButton` ใน `SheetHeader` ให้ replay ได้เสมอ (create หรือ edit)
- Sheet mount/unmount ตอนเปิด/ปิด → FeatureTour re-mount ทุกครั้งที่เปิด create แต่ `toursSeen` กันเล่นซ้ำ (เล่นแค่ครั้งแรกจริง ๆ)

**B. Trim page tours:** `players` / `matches` (หน้า) → **ไม่ auto** — เอา `<FeatureTour>` ออกจาก page-level ของ 2 หน้านี้ (คงไว้เฉพาะปุ่ม `?` ใน PageHeader). welcome/dashboard คงเดิม

---

## 2. Registry (`src/content/help/`)
เพิ่มเข้า `FeatureKey` ใน `index.ts`: `"player-editor"`, `"match-editor"`, `"match-detail"` + import 3 โมดูลใหม่เข้า registry

| ไฟล์ใหม่ | เนื้อหา (ดู copy ใน help-tutorial-spec Addendum) |
|---|---|
| `player-editor.tsx` | title "แก้ไขการ์ดผู้เล่น" + tour 5 step |
| `match-editor.tsx` | title "เพิ่ม/แก้นัด" + tour: opponent→datetime→venue→recurrence→save |
| `match-detail.tsx` | title "รายละเอียดนัด" + tour: mark-played→edit→delete (+scope ถ้าซ้ำ) |

แก้ `players.tsx` + `matches.tsx`: **trim tour** เหลือเฉพาะ target บนหน้า (list/calendar) — ย้าย step ที่อยู่ใน sheet ไปโมดูลใหม่

---

## 3. data-tour attributes

### มีอยู่แล้ว ✅
| selector | ไฟล์ |
|---|---|
| `players-add` | players-manager.tsx:66 |
| `player-actions` | player-actions.tsx:32 |
| `player-card-preview` | player-card-editor.tsx:236 |
| `player-photo` | player-card-editor.tsx:350 |
| `player-stat-tiles` | player-form-sheet.tsx:260 |
| `matches-view-toggle` | matches-client.tsx:242 |
| `matches-fab` | matches-client.tsx:295 |
| `match-item` | fixture-card.tsx:33 |

### ต้องเพิ่ม ➕
| selector | ไฟล์ที่จะแปะ |
|---|---|
| `player-position` | position-pills.tsx (wrapper ของกลุ่มปุ่ม) |
| `player-save` | player-form-sheet.tsx (wrapper รอบ `<SubmitBar>`) |
| `matches-month-grid` | month-view.tsx (grid ปฏิทิน) |
| `match-opponent` | event-form.tsx (field คู่แข่ง) |
| `match-datetime` | event-form.tsx (กลุ่ม date + time + all-day) |
| `match-venue` | event-form.tsx (สนาม/field) |
| `match-recurrence` | recurrence-fields.tsx (wrapper) |
| `match-save` | event-form.tsx (wrapper รอบ SubmitBar) |
| `match-mark-played` | event-detail.tsx (ปุ่ม "บันทึกผล") |
| `match-edit` | event-detail.tsx (ปุ่มแก้ไข) |
| `match-delete` | event-detail.tsx (ปุ่มลบ) |

> ทุก selector ที่ทัวร์อ้างต้องมี data-tour จริง ไม่งั้น `tour.ts` จะ skip เงียบ ๆ (mobile-safe แต่ทัวร์จะกระโดด)

---

## 4. ไฟล์ที่แตะ (file-by-file)

**Players**
- `src/content/help/index.ts` — +`"player-editor"` (FeatureKey + registry)
- `src/content/help/player-editor.tsx` — ใหม่
- `src/content/help/players.tsx` — trim tour เหลือ `players-add`, `player-actions`
- `players/player-form-sheet.tsx` — `isCreate` = `player == null`; `<HelpButton featureKey="player-editor"/>` ใน SheetHeader; `{isCreate && <FeatureTour featureKey="player-editor"/>}`; `data-tour="player-save"` รอบ SubmitBar; เอา page-level auto ออก (ถ้ามี)
- `players/position-pills.tsx` — `data-tour="player-position"`
- `players/players-manager.tsx` / `players/page.tsx` — เอา `<FeatureTour featureKey="players"/>` ออก (ไม่ auto หน้า list) เหลือ `?` ใน PageHeader

**Matches**
- `src/content/help/index.ts` — +`"match-editor"`, `"match-detail"`
- `src/content/help/{match-editor,match-detail}.tsx` — ใหม่
- `src/content/help/matches.tsx` — trim tour เหลือ `matches-view-toggle`, `matches-fab`, `match-item`, `matches-month-grid`
- `matches/event-form.tsx` — `isCreate = event == null`; HelpButton `match-editor` ใน header; `{isCreate && <FeatureTour featureKey="match-editor"/>}`; data-tour: `match-opponent`/`match-datetime`/`match-venue`/`match-save`
- `matches/recurrence-fields.tsx` — `data-tour="match-recurrence"`
- `matches/event-detail.tsx` — HelpButton `match-detail`; data-tour: `match-mark-played`/`match-edit`/`match-delete` (ไม่ auto)
- `matches/month-view.tsx` — `data-tour="matches-month-grid"`
- `matches/matches-client.tsx` / `matches/page.tsx` — เอา page-level auto ออก (เหลือ `?`)

**หมายเหตุ HelpButton ใน SheetHeader:** ปัจจุบัน HelpButton ผูกผ่าน PageHeader — ต้องให้ใช้ standalone ใน SheetHeader ได้ (ถ้ายังไม่ได้ ให้ render `<HelpButton featureKey=.../>` ตรง ๆ ใน header ของ sheet)

---

## 5. Task checklist
1. index.ts: +3 FeatureKey + import โมดูลใหม่
2. เขียน content: player-editor / match-editor / match-detail (ไทย, copy จาก Addendum)
3. trim players.tsx + matches.tsx tours
4. แปะ data-tour 11 จุด (ตาราง §3 ➕)
5. player-form-sheet + event-form: `isCreate` gate + conditional `<FeatureTour>` + `<HelpButton>` ใน header
6. event-detail: `<HelpButton match-detail>` (ไม่ auto)
7. เอา page-level auto ของ players/matches ออก
8. Verify: `tsc --noEmit` + `lint`; login → **create** player/match ครั้งแรก = ทัวร์เล่นเอง; **edit** = ไม่เล่น; `?` = replay ได้; toggle off = ไม่ auto; reduced-motion ok

---

## 6. Out of scope (ไม่ทำรอบนี้)
- Interactive tour (พา UI เปิด/กรอก) — ยังคง highlight-only
- day-sheet / scope-sheet tour แยก (scope อธิบายเป็น step ใน match-detail พอ)
