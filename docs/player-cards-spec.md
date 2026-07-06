# Spec: Player Photo Cards + Extended Stats (Wave 5)

> ต่อยอดจาก `migration-spec.md` + `admin-ux-spec.md`
> เพิ่ม: รูปผู้เล่น (เก็บบน **Supabase Storage**), stat เพิ่มเติม, section ใหม่บนหน้า public เป็น **flip card** (คลิก/แตะเพื่อพลิกดูสถิติ), และ UI อัปโหลดรูปในหน้า admin players

**สถานะ:** เป็นฟีเจอร์หลัง Wave 4 — ต้องมี **Prisma migration** + ต่อ Supabase Storage. อย่าเริ่มจนกว่า Wave 4 (โดยเฉพาะ 4a Players) จะ merge เพราะทับ player admin form

---

## 1. เป้าหมาย
1. เก็บ **รูปผู้เล่น** 1 รูป/คน บน Supabase Storage
2. เก็บ **stat เพิ่มเติม** (position, เบอร์เสื้อ, การ์ด, MOTM ฯลฯ)
3. หน้า public: section ใหม่ **"Squad"** ล่างสุดของ player section — การ์ดโชว์รูปเต็ม, **คลิก/แตะเพื่อ flip** ดูสถิติด้านหลัง
4. หน้า admin players: **อัปโหลด/เปลี่ยน/ลบรูป** + กรอก stat เพิ่ม (mobile-friendly, ถ่ายจากกล้องได้)

---

## 2. Data Model — เพิ่ม field ใน `Player`

```prisma
model Player {
  // ...ของเดิม: name, matchesPlayed, goals, assists, cleanSheets, sortOrder

  // --- รูป ---
  imagePath     String?   // object path บน storage เช่น "players/<id>/<uuid>.webp" (ไว้ลบ/แทนที่)
  imageUrl      String?   // public URL (derive จาก path; cache ไว้เพื่อ render ตรง)

  // --- ข้อมูลการ์ด ---
  nickname      String?
  position      Position? // enum ด้านล่าง
  jerseyNumber  Int?

  // --- stat เพิ่ม (ยืนยันรายการใน §7) ---
  yellowCards   Int  @default(0)
  redCards      Int  @default(0)
  motm          Int  @default(0)   // man of the match
  saves         Int  @default(0)   // สำหรับ GK
  // (cleanSheets เดิมใช้ต่อสำหรับ GK)
}

enum Position {
  GK
  DF
  MF
  FW
}
```

Migration: `pnpm prisma migrate dev --name player_photos_and_stats` (fields ทั้งหมด optional/มี default → migrate ปลอดภัยกับข้อมูล 27 คนเดิม)

---

## 3. Supabase Storage setup

**2 buckets** (public read, write เฉพาะ server ด้วย service secret key) — สร้างแล้วทั้งคู่ ✅

| Bucket | ใช้กับ | Object path | bg-removal |
|---|---|---|---|
| `player-photos` | รูปผู้เล่น (cut-out) | `players/{playerId}/{uuid}.png` | ✅ (2-mode §4.1) |
| `club-assets` | crest/logo + OG image | `crest/{uuid}.png`, `og/{uuid}.png` | ❌ upload ตรง (resize เฉย ๆ) |

- **write เฉพาะ server** (service secret key, server-only) — ไม่เปิด client write, ไม่ต้องเขียน RLS
- Public URL: `https://<ref>.supabase.co/storage/v1/object/public/<bucket>/<path>`
- **`src/lib/supabase-storage.ts` เป็น generic** (รับ `bucket` param) → ใช้ซ้ำได้ทั้ง player + club. Club form (Wave 4c) อัปเกรด crestUrl/ogImageUrl จาก text → upload (เก็บเข้า `club-assets`)

**Env** (ตั้งค่าแล้วใน `.env`):
```bash
NEXT_PUBLIC_SUPABASE_URL="https://yjrwnatbusouwzbvmcnb.supabase.co"          # มีแล้ว
SUPABASE_SERVICE_SECRET_KEY="<secret — server only, ห้าม NEXT_PUBLIC, ห้ามวางในแชต>"   # ✅ ตั้งแล้ว
SUPABASE_STORAGE_ENDPOINT="https://yjrwnatbusouwzbvmcnb.storage.supabase.co/storage/v1/s3"  # ✅ S3-compatible (เผื่อใช้ S3 SDK)
SUPABASE_STORAGE_BUCKET="player-photos"   # ถ้าไม่ตั้ง ใช้ default "player-photos"
```

> **2 ทางเชื่อม storage** (เลือกใน implement):
> - **แนะนำ: `@supabase/supabase-js`** (standard Storage API) — ใช้ `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_SECRET_KEY` ฝั่ง server. ตรงกับ signed-upload-URL flow (§4)
> - **ทางเลือก: S3 protocol** ผ่าน `SUPABASE_STORAGE_ENDPOINT` — ใช้ AWS S3 SDK ได้ แต่ต้องสร้าง **S3 access keys แยก** ใน Supabase (คนละอันกับ service secret) — เก็บ endpoint ไว้เผื่ออนาคต

**`next.config.ts`** — อนุญาตโดเมน storage ให้ `next/image`:
```ts
images: {
  remotePatterns: [
    { protocol: "https", hostname: "yjrwnatbusouwzbvmcnb.supabase.co", pathname: "/storage/v1/object/public/**" },
  ],
}
```

> ใช้ **`@supabase/supabase-js` เฉพาะฝั่ง server เพื่อ Storage เท่านั้น** (auth ยังเป็น Auth.js เหมือนเดิม ไม่ทับกัน) — สร้าง client ที่ `src/lib/supabase-storage.ts` ด้วย service role key + `import "server-only"`

---

## 4. Upload flow (admin) — แนะนำ **signed upload URL (client อัปตรงเข้า Storage)**

หลีกเลี่ยงการส่งไฟล์ผ่าน Server Action (body limit ~1MB + โหลด server) → ให้ server ออก signed URL แล้ว client PUT ไฟล์ตรงเข้า Storage:

```
[Admin เลือกรูป]
   │  client: resize/compress เป็น webp ≤ ~1600px (canvas) เพื่อลดขนาด
   ▼
(1) server action  requestPlayerPhotoUpload(playerId)
     - requireUser("player:write")
     - supabase.storage.createSignedUploadUrl(path)   // service role, server-only
     - return { path, token/signedUrl }
   │
   ▼
(2) client PUT ไฟล์ → signedUrl  (อัปตรงเข้า Supabase Storage)
   │
   ▼
(3) server action  savePlayerPhoto(playerId, path)
     - requireUser("player:write")
     - ลบรูปเก่า (ถ้ามี imagePath) ออกจาก storage
     - prisma.player.update({ imagePath, imageUrl: publicUrl(path) })
     - revalidatePath("/") + "/admin/players"
```

**ทางเลือกที่ง่ายกว่า (ถ้าไฟล์เล็ก):** อัปผ่าน Server Action รับ `File` แล้ว `supabase.storage.upload()` ฝั่ง server — ต้องตั้ง `serverActions.bodySizeLimit: "4mb"` ใน next.config. เลือกวิธีนี้ได้ถ้าอยากลดความซับซ้อน (บังคับ compress client ก่อน)

**Validation:** ชนิด `image/jpeg|png|webp`, ขนาด ≤ 4MB (ก่อน compress), แนะนำ compress → webp ฝั่ง client. **Delete photo:** action `deletePlayerPhoto(playerId)` ลบ object + clear field

**Mobile-friendly:** `<input type="file" accept="image/*" capture="environment">` เพื่อถ่ายจากกล้องได้, โชว์ preview + ปุ่มลบ, สถานะ uploading (progress/spinner) + toast

### 4.1 Background removal — **2 modes ในหน้าอัปโหลด** ✅
ผู้ใช้เลือกได้ต่อการอัปโหลดแต่ละครั้ง:

- **Mode "ตัดด้วยระบบ" (auto)** — ใช้ **`@imgly/background-removal`** ลบพื้นหลังในเบราว์เซอร์ (client, ฝั่ง admin เท่านั้น ไม่กระทบ public bundle) → ได้ PNG โปร่งใส
- **Mode "อัป PNG ที่ตัดมาแล้ว" (manual)** — ผู้ใช้มีรูปโปร่งใสอยู่แล้ว อัปตรง ไม่ต้องประมวลผล

**Flow ทั้ง 2 mode:**
```
เลือกรูป → [auto: removeBackground() ในเบราว์เซอร์]  → PNG โปร่งใส
        → PREVIEW บนการ์ดตัวอย่าง (วางบนสนามให้เห็นจริงก่อนเซฟ)
        → ยืนยัน → resize/compress webp/png → upload (signed URL) → savePlayerPhoto
```
- **Preview บังคับ**: โชว์รูปที่ตัดแล้ววางบน mockup การ์ด (front) ให้เห็นผลจริงก่อนกด Save — ถ้าตัดไม่สวย เลือก re-do / สลับไป manual ได้
- auto mode มี loading state (โมเดล WASM รันครั้งแรกจะโหลดสักครู่)
- validation: ผลลัพธ์ควรเป็น PNG โปร่งใส; manual mode เตือนถ้าอัปรูปที่ไม่มี alpha channel

---

## 5. Public UI — "Squad" flip cards

Section ใหม่ **ล่างสุดของ player section** ใน `page.tsx` (หลัง `PlayerStatsTable`) → `<SquadGrid players={...} />`

### 5.1 Layout — **เลือก Treatment B: Cut-out บนสนาม (in-game look)** ✅
(ดู prototype: `docs/prototypes/player-card-proto.html`)
- **Grid**: 2 คอลัมน์บนมือถือ → 3 (sm) → 4 (lg). การ์ด aspect **3:4 (portrait)**
- **หน้า (front):** background สนามบอลกลางคืน (grass gradient + mowing stripes + เส้นโค้ง penalty arc + ไฟสเตเดียม/halo) + **รูปผู้เล่นตัดพื้นหลัง (cut-out PNG โปร่งใส)** ยืนบนสนาม + ground shadow + ชื่อ/nickname + เบอร์ + position badge. ถ้าไม่มีรูป → silhouette/monogram บนสนาม
- **หลัง (back):** background สนาม (จางลง) + glass panel สถิติ grid (Goals / Assists / Apps / MOTM / Cards) ใช้โทน StatBadge (emerald/blue/rose/amber), ชื่อ+เบอร์ด้านบน

### 5.1.1 ⚠️ Cut-out image handling (สิ่งที่ Treatment B ต้องมี)
รูปต้อง **ตัดพื้นหลังเป็น PNG โปร่งใส** ก่อนถึงจะยืนบนสนามได้ — ต้องเลือกวิธีจัดการ (ดู §7 decision ใหม่):
- **A) Browser lib** (`@imgly/background-removal`) — ลบพื้นหลังในเบราว์เซอร์ตอนอัปโหลด, ฟรี/ไม่ส่งรูปออกนอก, bundle หนักเฉพาะโซน admin (ไม่กระทบ public). แนะนำสำหรับทีมเล็ก
- **B) External API** (remove.bg / Photoroom) — คุณภาพดีสุดกับรูปสนามยาก ๆ, ต้องมี API key + มีค่าใช้จ่าย
- **C) Manual** — ให้ผู้อัปโหลดตัดเองแล้วอัป PNG โปร่งใส (ง่ายสุดฝั่งระบบ, ภาระอยู่ที่คน)
- ทุกวิธี: preview ก่อนบันทึก + fallback silhouette ถ้ายังไม่มีรูป

### 5.2 Interaction — คลิก/แตะเพื่อ flip (ตามที่ต้องการ)
- **ทั้ง desktop + mobile: click/tap → toggle flip** (บนมือถือไม่มี hover จึงใช้ tap เป็นหลัก)
- Desktop เสริม: hover = ยกการ์ด/เงา (ไม่ flip auto) — flip เกิดตอน "คลิก" ตามสเปคที่ผู้ใช้ระบุ
- การ์ดเป็น `<button>` (a11y): `aria-pressed={flipped}`, กด Enter/Space ได้, focus ring sky
- คลิกซ้ำ = flip กลับ

### 5.3 CSS 3D flip
```
.card        { perspective: 1000px; }
.card-inner  { transform-style: preserve-3d; transition: transform 500ms cubic-bezier(.2,.7,.2,1); }
.card.flipped .card-inner { transform: rotateY(180deg); }
.card-face   { position:absolute; inset:0; backface-visibility:hidden; }
.card-back   { transform: rotateY(180deg); }
```
- **`prefers-reduced-motion`:** ไม่พลิก 3D → ใช้ crossfade (opacity) แทน (มี guard ใน globals.css อยู่แล้ว)
- คอมโพเนนต์เป็น client (`"use client"`) เฉพาะการ์ด; grid เป็น server ส่ง data ลงมา

### 5.4 ธีม
dark stadium/glassmorphism เดิม: `rounded-3xl border-white/10 ring-1 ring-white/10`, glass, sky glow, Geist — เข้าชุดกับ `TeamStatsCards`/`StatBadge`

---

## 6. Task breakdown (Wave 5 — ทำหลัง Wave 4 merge)

1. **Migration**: เพิ่ม field + enum `Position` ใน schema → `migrate dev`
2. **Storage**: bucket `player-photos` (public) ✅, `SUPABASE_SERVICE_SECRET_KEY` ✅, `next.config` remotePatterns, `src/lib/supabase-storage.ts` (server-only, `@supabase/supabase-js` + service secret key)
3. **Admin (ต่อจาก 4a)**: เพิ่ม field รูป + stat ใหม่ในฟอร์ม players; upload component (signed URL flow, compress→webp, camera capture, preview, delete); server actions `requestPlayerPhotoUpload` / `savePlayerPhoto` / `deletePlayerPhoto` (+guard `player:write`)
4. **Public**: `SquadGrid` + `PlayerFlipCard` (client) + วาง section ใน `page.tsx`; แก้ `getFootballStats`/player mapping ให้ส่ง imageUrl/position/เบอร์/stat เพิ่ม
5. **Seed/backfill**: ผู้เล่น 27 คนยังไม่มีรูป → placeholder ทำงานได้; อัปโหลดทีละคนผ่าน admin
6. Verify: tsc/lint + upload e2e + flip a11y (keyboard/reduced-motion) + `next/image` โหลดจาก storage

---

## 7. Decisions

**ตัดสินใจแล้ว:**
- ✅ Card direction = **Treatment B (cut-out บนสนาม, in-game look)**
- ✅ Flip trigger = **คลิก/แตะ** (desktop เสริม hover-lift ไม่ flip auto)
- ✅ ธีม dark-only (สนามกลางคืน)

- ✅ **Background removal** = 2 modes (auto ด้วย `@imgly/background-removal` / manual อัป PNG ตัดมาแล้ว) + preview บังคับ (ดู §4.1)
- ✅ **Stats** = ต่อยอดจากที่ DB มี + เพิ่มใบเหลือง/ใบแดง/MOTM, **แก้ได้ทั้งหมดในหน้า admin players** (ดู §7.1)

**ยังต้องยืนยัน:**
1. **Storage integration**: signed-URL direct upload (แนะนำ, เลี่ยง body limit) หรือ upload ผ่าน server action? → เพิ่ม dep `@supabase/supabase-js` (เฉพาะ server/storage)
2. **Bucket**: public read (แนะนำ) หรือ private + signed URL
3. รูป 1 รูป/คน (สเปคนี้) หรือ gallery หลายรูป

## 7.1 Stats — DB รองรับอะไร + เพิ่มอะไร

**มีอยู่แล้วใน DB (`Player` table ตอนนี้):**
| field | ชนิด |
|---|---|
| `matchesPlayed` | Int |
| `goals` | Int |
| `assists` | Int |
| `cleanSheets` | Int (ใช้กับ GK) |

**เพิ่มใน migration Wave 5** (ทั้งหมด optional/มี default → ปลอดภัยกับ 27 คนเดิม):
| field | ชนิด | หมายเหตุ |
|---|---|---|
| `yellowCards` | Int @default(0) | ใบเหลือง |
| `redCards` | Int @default(0) | ใบแดง |
| `motm` | Int @default(0) | man of the match |
| `saves` | Int @default(0) | เซฟ (สำหรับ GK) |
| `position` | Position? (enum GK/DF/MF/FW) | สำหรับ badge บนการ์ด |
| `jerseyNumber` | Int? | เบอร์เสื้อ |
| `nickname` | String? | ชื่อเล่นบนการ์ด |
| `imagePath` / `imageUrl` | String? | รูป (§2) |

> **admin แก้ได้ทุกตัว**: ต่อยอดฟอร์ม players (Wave 4a) — เพิ่ม field เหล่านี้เข้าฟอร์ม create/edit ให้กรอก/แก้ได้ครบ ไม่ใช่แค่แสดงบนการ์ด. การ์ดหลัง (back) โชว์ stat ตาม position — GK เน้น cleanSheets/saves, outfield เน้น goals/assists
>
> **`appearances` ไม่เพิ่ม** — ซ้ำกับ `matchesPlayed` ที่มีอยู่แล้ว (appearances = จำนวนนัดที่ลงเล่น = matchesPlayed ตัวเดียวกัน)
