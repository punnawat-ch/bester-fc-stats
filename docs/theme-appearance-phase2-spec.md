# Appearance Theming — Phase 2 Spec (DB · Draft/Publish · Runtime Inject)

**Prereq:** Phase 1 done — semantic token layer in `src/app/globals.css`, brand seed in
`:root` (`--brand`, `--brand-foreground`, `--brand-ring`). See `docs/theme-token-refactor-spec.md`.

**Goal:** ให้ admin ตั้ง "สีประจำสโมสร" (brand/CI) → มีผลทั้งเว็บแบบ global, มีประวัติ revision +
draft/publish + revert. Runtime = override brand seed ไม่กี่ค่า, ที่เหลือ derive เอง.

**Out of scope (Phase 2b):** custom section/layout editing.

---

## 1. Data model (Prisma)

```prisma
model Club {
  // ...ของเดิม (themeColor คงไว้ — ใช้กับ <meta name="theme-color">, sync จาก brand ตอน publish)
  activeAppearanceId String?             @unique
  activeAppearance   AppearanceRevision? @relation("ActiveAppearance", fields: [activeAppearanceId], references: [id])
  appearances        AppearanceRevision[] @relation("ClubAppearances")
}

model AppearanceRevision {
  id          String           @id @default(cuid())
  clubId      String
  club        Club             @relation("ClubAppearances", fields: [clubId], references: [id], onDelete: Cascade)
  status      AppearanceStatus @default(DRAFT)
  tokens      Json             // brand seed เท่านั้น (ดู §2) — ไม่เก็บ derived token
  label       String?          // "CI 2026", "ธีมสงกรานต์"
  note        String?
  createdAt   DateTime         @default(now())
  publishedAt DateTime?
  createdById String?          // FK -> User (audit; ใครสร้าง/แก้)
  createdBy   User?            @relation(fields: [createdById], references: [id], onDelete: SetNull)
  activeForClub Club[]         @relation("ActiveAppearance")

  @@index([clubId, status, createdAt])
}

enum AppearanceStatus { DRAFT PUBLISHED ARCHIVED }
```

**Invariants**
- **Append-only:** ทุกการเซฟ = insert row ใหม่ ไม่ update `tokens` ทับ
- ต่อ Club มี PUBLISHED ที่ active ได้ **1 ตัว** (`Club.activeAppearanceId`, `@unique`)
- Migration: seed AppearanceRevision แรกจาก `Club.themeColor` เดิม → set เป็น PUBLISHED + active

---

## 2. Token seed shape (`tokens` JSON)

เก็บ **แค่ค่าที่ override ไม่ได้ derive**. derived (hover/active/subtle/ring) คำนวณใน CSS ด้วย `color-mix`.

```jsonc
{
  "brand": "#38bdf8",           // required — CI หลัก (สีเดียว, ตามที่ตัดสินใจ)
  "brandForeground": "#08110c", // computed (auto-contrast black/white) — เก็บเพราะ CSS เลือก contrast เองยาก
  "radius": "1rem"              // optional — ความมนตาม CI
}
```

> **ตัดสินใจแล้ว:** brand **สีเดียว** (ไม่มี secondary). ปรับ **accent อย่างเดียว** — neutral
> surfaces (dark stadium) **คงที่**, ไม่ต้อง derive/contrast พื้นหลัง → spec เรียบขึ้นมาก

- **เล็ก + forward-compatible:** เพิ่ม token ใหม่ภายหลัง revision เก่าก็ render ได้ (ค่าที่ไม่มี = default)
- Validate ด้วย Zod: `brand` = hex 6 หลัก, contrast(brand, brandForeground) ≥ 4.5 (WCAG AA)

---

## 3. Palette derivation (ไม่ต้องเก็บลง DB)

จาก `--brand` ตัวเดียว derive state variants ใน CSS ตอน runtime — **ไม่ต้องใช้ JS**:

```css
/* globals.css — เพิ่มใน :root layer ต่อจาก brand seed */
:root {
  --brand-hover:  color-mix(in oklab, var(--brand), black 12%);
  --brand-active: color-mix(in oklab, var(--brand), black 22%);
  --brand-subtle: color-mix(in oklab, var(--brand), transparent 88%); /* ~12% tint */
}
```

**สิ่งที่ต้องใช้ JS (server, ตอน save/publish):** เลือก `brandForeground` (ดำ/ขาว) จาก WCAG relative
luminance ของ brand — hand-roll ได้ ไม่ต้องพึ่ง lib:

```ts
// lib/appearance/contrast.ts
function relLuminance(hex: string): number { /* sRGB→linear→0.2126R+0.7152G+0.0722B */ }
export function pickForeground(brandHex: string): "#ffffff" | "#08110c" {
  const L = relLuminance(brandHex);
  const contrastWhite = 1.05 / (L + 0.05);
  return contrastWhite >= 4.5 ? "#ffffff" : "#08110c";
}
```

**Admin preview palette ramp (optional):** ถ้าอยากโชว์ 50–950 ramp ใน UI ใช้ `culori` (tree-shakeable)
แปลง hex→oklch แล้วไล่ lightness — ใช้แค่ฝั่ง UI, ไม่เก็บผลลง DB

---

## 4. Runtime injection (SSR, no FOUC)

Global theme → render จาก server ที่ root layout ก่อน paint แรก → **ไม่มี flash เลย** (ไม่ต้อง
next-themes/blocking script เพราะไม่ใช่ per-visitor)

```tsx
// src/app/layout.tsx
import { getActiveAppearance } from "@/lib/appearance/service";
import { appearanceToCssVars } from "@/lib/appearance/css";

export default async function RootLayout({ children }) {
  const seed = await getActiveAppearance();            // { brand, brandForeground, ... }
  return (
    <html lang="en" style={appearanceToCssVars(seed)}> {/* sets --brand, --brand-foreground, --brand-ring */}
      <body className="bg-surface text-fg antialiased">…</body>
    </html>
  );
}
```

- `appearanceToCssVars` → `{ "--brand": seed.brand, "--brand-foreground": seed.brandForeground, "--brand-ring": <brand@60%> }`
  ทับค่า default ใน `:root` ของ globals.css (inline style ชนะ)
- ระวัง: ค่าที่ inject ต้อง sanitize (เป็น hex/rgb ที่ผ่าน Zod) กัน CSS injection

---

## 5. Draft / Publish / Preview / Revert

| Action | ผล |
|---|---|
| **Save** | insert revision `status=DRAFT` (ยังไม่กระทบ public) |
| **Preview** | admin ตั้ง cookie `appearance_preview=<draftId>` (layout อ่าน `cookies()` ได้; `searchParams` อ่านไม่ได้ใน layout) → layout render draft **เฉพาะเมื่อ session มี `club:edit`** |
| **Publish** | draft→`PUBLISHED`+`publishedAt`, ตัว published เดิม→`ARCHIVED`, set `Club.activeAppearanceId`, sync `Club.themeColor`, `revalidatePath("/", "layout")` |
| **Revert** | clone revision (ARCHIVED) → `DRAFT` ใหม่ → publish (audit ครบ, revert ซ้อนได้) |

**Guards (สำคัญ — สีมีผลทั้งเว็บ):**
- Public/anon อ่าน **PUBLISHED เท่านั้น**
- `?appearance=` มีผลต่อเมื่อ session เป็น admin (เช็คใน `getActiveAppearance` ผ่าน `auth()`)
- หน้า preview ต้อง `export const dynamic = "force-dynamic"` หรือกัน cache (ไม่งั้น draft รั่วไป CDN)
- Publish = revalidate layout เพื่อล้าง cache ของ getActiveAppearance

---

## 6. Service layer + caching

```ts
// lib/appearance/service.ts
export const getActiveAppearance = cache(async () => {
  const club = await prisma.club.findFirstOrThrow({ include: { activeAppearance: true } });
  return parseSeed(club.activeAppearance?.tokens) ?? DEFAULT_SEED; // DEFAULT_SEED = sky (ตรงกับ :root)
});
```
- ห่อ `getClub()` เดิมให้ include activeAppearance หรือแยก query
- ใช้ `unstable_cache`/`cache` + tag `"appearance"` แล้ว `revalidateTag("appearance")` ตอน publish

---

## 7. Admin UI (settings → appearance)

- **Color picker** (brand หลัก + optional secondary) → live preview พร้อม contrast warning ถ้า < AA
- **Palette preview:** โชว์ปุ่ม/badge/surface ตัวอย่างด้วยสีที่เลือก (ใช้ derived variants จาก §3)
- **Preset themes:** ชุดสำเร็จ (stadium/ocean/sunset/…) = seed สำเร็จรูป กดแล้วเป็น draft
- **Revision list:** timeline (label, ผู้แก้, เวลา, สถานะ) + ปุ่ม Preview / Publish / Revert / Diff
- Server Actions: `saveDraft`, `publishRevision`, `revertToRevision`, `deleteDraft` (typed + Zod + RBAC admin)

---

## 8. Build order (Phase 2)

1. Prisma: model + enum + migration + backfill จาก `themeColor`
2. `lib/appearance/*`: Zod schema, contrast, css-vars, service (+cache)
3. globals.css: เพิ่ม derived variants (`--brand-hover/active/subtle`) + repoint utility ที่ควรใช้ (เช่น `hover:bg-primary` → ใช้ `--brand-hover`)
4. layout inject + guards
5. Server actions + RBAC
6. Admin UI (picker → preview → list/revert) + presets
7. (optional) OKLCH ramp preview ด้วย culori

## 9. Decisions (locked)
- ✅ **Brand สีเดียว** (accent) — ไม่มี secondary
- ✅ **ปรับ accent อย่างเดียว** — neutral surfaces คงมืด (dark stadium), ไม่แตะ Phase 2
- ✅ **Preset 4-6 ชุด + custom** — admin เลือก preset หรือ pick เองก็ได้
- ⏳ ยังต้องนิยาม: รายชื่อ/สี preset 4-6 ชุด (เสนอ: Stadium=sky default, Ocean=cyan/teal,
  Sunset=orange/amber, Rose=pink/rose, Forest=emerald, Violet=purple) — ยืนยันตอนทำ §7
- ⏳ draft retention: เสนอ keep ทั้งหมด แต่ auto-archive draft ที่เก่ากว่า 30 วัน (ปรับได้)
