# Theme Token Refactor Spec (Phase 1)

**Goal:** รวมสีที่ hardcode กระจัดกระจายทั้งเว็บ ให้อยู่บน **semantic design-token layer**
ชั้นเดียว เพื่อเปิดทางให้ทำ **appearance/brand theming (white-label ต่อสโมสร)** ในเฟสถัดไป
โดย "การเปลี่ยนสีสโมสร" จะเหลือแค่การสลับค่า CSS variable ไม่กี่ตัว

**Phase 1 scope = เปลี่ยนสีให้ผ่าน token เท่านั้น** ไม่แตะ layout / logic / โครง DOM
Phase 2 (inject brand จาก DB, admin settings UI, OKLCH palette gen) อยู่นอก spec นี้

---

## 1. หลักการ: token 3 กลุ่มตาม "ใครคุม"

| กลุ่ม | เปลี่ยนตามสโมสรไหม | ตัวอย่าง role |
|---|---|---|
| **BRAND** | ✅ เปลี่ยน (Phase 2) | accent, ปุ่ม active/selected, focus ring, link |
| **STATUS** | ❌ คงที่ (สื่อความหมาย) | win=เขียว, loss=แดง, success/danger/info |
| **PODIUM** | ❌ คงที่ (สากล) | gold / silver / bronze |
| **NEUTRAL** | ❌ คงที่ (Phase 1) | surface มืด, text, border, shadow |

> ⚠️ กฎเหล็ก: **status/podium ห้ามผูกกับสีแบรนด์** — ถ้าสโมสรใช้สีแดง ปุ่ม "แพ้" กับ
> "แบรนด์" จะกลายเป็นแดงเหมือนกันจนอ่านไม่ออก

---

## 2. Token contract (นิยามใน `src/app/globals.css` — เขียนครั้งเดียว ห้าม agent แก้ไฟล์นี้)

Agent ทุกตัว **ใช้ได้เฉพาะ token ด้านล่างนี้**. ถ้าเจอสีที่ map ไม่ได้ **ห้ามคิด token เอง** —
คงของเดิมไว้แล้ว report กลับมาในหัวข้อ "Unmapped colors"

### BRAND (ผูก `var(--brand)` — override runtime ได้)
- `bg-primary` `text-primary` `border-primary` `ring-primary` — สี accent สโมสร
- `text-primary-foreground` `bg-primary-foreground` — ตัวอักษร/พื้นบน primary (auto-contrast)
- `ring-ring` `border-ring` `outline-ring` — focus ring (= brand)

### NEUTRAL — surface
- `bg-surface` — พื้นหน้าเพจ (`#08110c`)
- `bg-panel` — การ์ด/พาเนลหลัก (`#0a1222`) — ใส่ opacity ได้ เช่น `bg-panel/80`
- `bg-panel-2` — พาเนลรอง/popover (`#0b1224`)
- `bg-glass` — glass raised อ่อน (เดิม `bg-white/5`)
- `bg-glass-2` — glass ชั้นกลาง (เดิม `bg-white/8`)
- `bg-glass-3` — glass ชั้นเข้ม (เดิม `bg-white/10`)

### NEUTRAL — text
- `text-fg` — ข้อความหลัก (เดิม `text-white`)
- `text-fg-muted` — รอง (เดิม `text-white/70`, `/60`)
- `text-fg-subtle` — จาง (เดิม `text-white/50`, `/40`)
- `text-fg-inverse` — บนพื้นสว่าง (เดิม `text-[#06120c]`, `text-[#08110c]`)

### NEUTRAL — border / ring
- `border-border` `ring-border` — เส้นปกติ (เดิม `border-white/10`)
- `border-border-strong` — เข้มขึ้น (เดิม `border-white/20`)
- `border-border-hover` — สำหรับ `hover:` (เดิม `hover:border-white/30`)

### NEUTRAL — shadow
- `shadow-panel` — `0 20px 50px rgb(0 0 0 / .45)`
- `shadow-panel-sm` — `0 16px 35px rgb(0 0 0 / .4)`
- `shadow-panel-lg` — `0 22px 60px rgb(0 0 0 / .45)`

### STATUS (คงที่ — ใส่ opacity ได้)
- `success` (เขียว, เดิม emerald) → `bg-success/20 text-success` / `text-success-fg` (ตัวอักษรจาง)
- `info` (ฟ้า, เดิม blue) → `bg-info/20 text-info` / `text-info-fg`
- `warning` (เหลือง/ส้ม, เดิม amber/orange) → `bg-warning/20 text-warning` / `text-warning-fg`
- `danger` (แดง, เดิม rose/red) → `bg-danger/20 text-danger` / `text-danger-fg`

### PODIUM (คงที่)
- `podium-gold` (เดิม amber-300/500 + **MOTM/award accent**) · `podium-silver` (เดิม slate-300/400) · `podium-bronze` (เดิม orange-300/500)

### POSITION (คงที่ categorical — GK/DF/MF/FW badge)
- `bg-pos-gk` (เดิม amber-400) · `bg-pos-df` (เดิม violet-400) · `bg-pos-mf` (เดิม sky-400) · `bg-pos-fw` (เดิม emerald-400)
- ตัวอักษรบน badge (เดิม `text-[#061018]`) → `text-fg-inverse`

### FOOTBALL SEMANTIC (คงที่)
- 🟨 ใบเหลือง (เดิม amber) → `warning` · 🟥 ใบแดง (เดิม rose) → `danger`

### MISC / EFFECTS
- `bg-scrim/N` — overlay scrim (เดิม `bg-black/N`)
- shadow เพิ่ม: `shadow-elevate-sm` (เดิม `0_6px_18px`), `shadow-elevate-md` (เดิม `0_12px_24px`),
  `shadow-elevate-lg` (เดิม `0_12px_30px` / `0_12px_30px`) — ทุกตัว `rgba(0,0,0,.35)`
- **BRAND decision:** accent สี sky/ฟ้า ที่เป็น decorative (เลขเสื้อ, saves, assists, dot) → `primary`
  (ตาม brand; default=sky หน้าตาเท่าเดิม)
- arbitrary decorative ที่ไม่มี token (drop-shadow, text-shadow glow, radial sheen `rgba(255,255,255,..)`)
  → คงไว้ได้ ไม่กระทบ theming

---

## 3. Mapping rulebook (เดิม → ใหม่)

| เดิม (hardcoded) | ใหม่ (token) |
|---|---|
| `bg-[#08110c]` | `bg-surface` |
| `bg-[#0a1222]` / `bg-[#0a1222]/80` | `bg-panel` / `bg-panel/80` |
| `bg-[#0b1224]` / `/60` | `bg-panel-2` / `bg-panel-2/60` |
| `bg-white/5` | `bg-glass` |
| `bg-white/8` | `bg-glass-2` |
| `bg-white/10` | `bg-glass-3` |
| `bg-white`, `bg-white/90` (logo/active) | `bg-primary` (ถ้าเป็น active/selected) หรือคง `bg-white` ถ้าเป็นพื้นโลโก้จริง* |
| `text-white` | `text-fg` |
| `text-white/70`, `text-white/60` | `text-fg-muted` |
| `text-white/50`, `text-white/40` | `text-fg-subtle` |
| `text-[#06120c]`, `text-[#08110c]` | `text-fg-inverse` |
| `border-white/10`, `ring-white/10` | `border-border`, `ring-border` |
| `border-white/20` | `border-border-strong` |
| `hover:border-white/30` | `hover:border-border-hover` |
| `shadow-[0_20px_50px_rgba(0,0,0,0.45)]` | `shadow-panel` |
| `shadow-[0_16px_35px_rgba(0,0,0,0.4)]` | `shadow-panel-sm` |
| `shadow-[0_22px_60px_rgba(0,0,0,0.45)]` | `shadow-panel-lg` |
| `bg-emerald-500/20 text-emerald-100/200` | `bg-success/20 text-success-fg` |
| `text-emerald-300` (เช่น checkbox accent) | `text-success` |
| `bg-blue-500/20 text-blue-100` | `bg-info/20 text-info-fg` |
| `bg-rose-500/15 text-rose-200` | `bg-danger/15 text-danger-fg` |
| `bg-amber-500/20 text-amber-100` / `border-amber-300/60` | `bg-podium-gold/20 text-podium-gold` / `border-podium-gold/60` |
| `border-slate-300/60` `bg-slate-400/20` | `border-podium-silver/60` `bg-podium-silver/20` |
| `border-orange-300/60` `bg-orange-500/20` | `border-podium-bronze/60` `bg-podium-bronze/20` |

\* **"active/selected" vs "พื้นสีขาวจริง":** ปุ่มที่ toggle แล้วเป็น `bg-white text-[#06120c]`
(เช่น Table/Compact toggle) = **active state → `bg-primary text-primary-foreground`**.
แต่พื้นหลังโลโก้ `bg-white/90` = พื้นขาวจริง → **คงไว้**. ใช้วิจารณญาณตาม context แล้ว report.

### กฎการทำ opacity
- `bg-panel/80`, `bg-panel-2/60` ใช้ได้ (panel เป็นสีทึบ)
- `bg-glass*`, `border-border*`, `*-success/info/danger/warning`, `podium-*` — token พวกนี้ **มี alpha
  ในตัวหรือใช้เป็นฐานสี** ให้ทำ opacity ผ่าน modifier เช่น `bg-success/20` เหมือน pattern เดิม
- gradient `from-white/10 via-white/5 to-transparent` → `from-glass-3 via-glass to-transparent`
  (หรือคงถ้าซับซ้อน แล้ว report)

---

## 4. กฎการแก้ไฟล์ (สำหรับทุก agent)

1. **แก้เฉพาะ `className` string ที่เป็นสี** — ห้ามแตะ layout, spacing, logic, props, JSX structure,
   framer-motion variants, ขนาด (`text-lg`, `px-4`, `rounded-2xl`) — เปลี่ยนแค่ **สี**
2. **รักษา opacity modifier เดิม** — `bg-[#0a1222]/80` → `bg-panel/80` (ห้ามทิ้ง `/80`)
3. **`text-white/80`** (ค่ากลางๆ) → ปัดเข้า `text-fg-muted` (70/60 กลุ่มเดียวกัน)
4. อย่าเปลี่ยนพฤติกรรม visual ให้ผิดเพี้ยน — เป้าหมายคือ **มองด้วยตาแล้วเหมือนเดิม** เป๊ะที่สุด
5. ถ้าเจอสีที่ตารางไม่ครอบคลุม (เช่น position color GK/DEF/MID/FWD, สี gradient แปลกๆ)
   → **คงของเดิมไว้** และบันทึกใน report ใต้หัวข้อ `Unmapped colors` (ไฟล์:บรรทัด + สีเดิม)
6. ห้ามแก้ `src/app/globals.css` และห้ามแก้ไฟล์อื่นนอกเหนือที่ได้รับมอบหมาย
7. ดู `src/components/TopBar.tsx` เป็น **reference ที่ทำเสร็จแล้ว** ว่าผลลัพธ์หน้าตาเป็นยังไง

---

## 5. Acceptance criteria (ต่อไฟล์)

- ไม่มี `text-white`, `bg-white/N`, `border-white/N`, `#hex`, `bg-<palette>-<n>` เหลือใน className
  ยกเว้นที่ report ว่า unmapped อย่างตั้งใจ
- `npx tsc --noEmit` ผ่าน (className เป็น string ไม่กระทบ type แต่กันพลาด syntax)
- diff มีแต่การเปลี่ยนสี — ไม่มีบรรทัด logic/layout เปลี่ยน
- report กลับมา: (a) จำนวนที่แปลง (b) รายการ Unmapped colors (c) จุดที่ตัดสินใจ active→primary

---

## 6. Migration order (เรียงตาม hotspot)

1. ✅ `globals.css` — token layer (เขียนแล้ว)
2. ✅ `components/TopBar.tsx` — reference (เขียนแล้ว)
3. `components/PlayerStatsTable.tsx` (66)
4. `components/MatchHistoryTable.tsx` (53)
5. `components/PlayerFlipCard.tsx` (50)
6. `components/MatchScheduleTimeline.tsx` (47)
7. `components/TeamStatsCards.tsx` (32)
8. `components/StatBadge.tsx` (19) · `components/ClubHeader.tsx` (17) ·
   `components/FixturesSection.tsx` (16) · `components/HighlightRow.tsx` · `components/SquadGrid.tsx`
9. `components/ui/*` — repoint (มี token อยู่แล้ว)
10. `app/admin/*` + `components/admin/*` — หลังสุด (ไม่กระทบ public)

Phase 2 (แยก spec): DB brand storage, `[data-theme]` injection ที่ layout, admin settings UI,
OKLCH palette generation, contrast validation.
