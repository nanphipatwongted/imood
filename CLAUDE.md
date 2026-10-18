# imood

เว็บเปิดเพลง + เสียงบรรยากาศสำหรับฟังไปพร้อมกับทำงาน (แนว Lofi.cafe / Noisli)
ผู้ใช้เลือกฉาก เปิดเพลง และผสมเสียงบรรยากาศเองได้ **ไม่มี login และไม่มี database**

## Stack

- Astro 7 + React island (`src/components/App.tsx`, mounted `client:only="react"`)
- Tailwind v4 (`@tailwindcss/vite`), font Kanit
- Howler.js สำหรับ ambient loops (`src/hooks/useAmbientMixer.ts`)
- YouTube IFrame API สำหรับเพลง (`src/components/MusicPlayer.tsx`)
- ค่าที่ผู้ใช้ตั้งเก็บใน `localStorage` key `imood:state` (`src/lib/storage.ts`) — มิกเซอร์แยกเก็บรายฉาก (`mixes[sceneId]`) ฉากที่ยังไม่เคยปรับใช้ค่าเริ่มต้นจาก `scenes.ts`
- ห้ามใช้ Supabase (โควตาใช้กับโปรเจกต์อื่นอยู่) — ถ้าวันหลังต้องเก็บข้อมูลจริง ใช้ Cloudflare D1/KV

## Data

| ไฟล์ | เนื้อหา |
|---|---|
| `src/data/scenes.ts` | ฉาก: gradient (placeholder), `video` / `poster` / `thumb` (optional), `sounds` = ชุดเสียงของฉากนั้น (เรียงตามลำดับในมิกเซอร์) + ความดังเริ่มต้น |
| `src/data/sounds.ts` | คลังเสียงบรรยากาศทั้งหมดที่ฉากไหนก็หยิบไปใช้ได้: `src: [ogg, m4a]` |
| `src/data/music.ts` | สถานีเพลง: YouTube video ID — **ID ของ live stream เปลี่ยนทุกครั้งที่ช่องรีสตาร์ทสตรีม** ต้องเช็คก่อน launch (`live_stream?channel=` embed ใช้ไม่ได้กับช่องเหล่านี้ เช็คแล้ว) ส่วนคลิปอัปโหลดปกติไม่หมดอายุ |
| `src/data/credits.json` | บันทึกที่มา + license ของทุก asset — **ต้องเพิ่มทุกครั้งที่ใส่ไฟล์ใหม่** |

## Assets

ไฟล์เสียงจริงแปลงด้วย `scripts/process-sound.sh <ไฟล์ต้นฉบับ> <sound-id>` (ตัดยาวสุด 120 วิ, crossfade หัวท้ายให้ลูปเนียน, ปรับความดัง -20 LUFS, ออกเป็น ogg + m4a)
แล้ว**ลบบรรทัดของเสียงนั้นออกจาก** `scripts/generate-placeholder-sounds.sh` ไม่อย่างนั้นรันสคริปต์ placeholder ซ้ำจะทับไฟล์จริง

ไฟล์จริงตอนนี้: storm, chatter, coffee, keyboard (CC0 ทั้งหมด) — ที่เหลือยังเป็น placeholder

สเปกไฟล์จริง:

- **ฉาก** `scenes/<id>/`: `video.webm` + `video.mp4` (720p–1080p, วนลูปเนียน 10–30 วิ, ไม่มีเสียง, ≤ ~8MB), `poster.webp` (1920×1080, ≤ ~300KB), `thumb.webp` (~400×225)
- **เสียง**: `<id>.ogg` (Opus 96–128kbps) + `<id>.m4a` (AAC), ยาว 1–3 นาที, ต่อหัวท้ายให้ลูปเนียน (ไม่ fade), ความดัง ~-20 LUFS
- ไฟล์ใหญ่ (วิดีโอ/เสียง) ตอน production ย้ายไป Cloudflare R2 (ไม่คิดค่า egress) — อย่าเสิร์ฟจาก Vercel ตรงๆ

## ลิขสิทธิ์

- เสียงบรรยากาศ: Freesound (CC0 เท่านั้น), Pixabay, Mixkit — ห้าม CC-BY-NC และ BBC Sound Effects
- วิดีโอ/รูป: Pexels, Pixabay, Mixkit, Coverr, Unsplash
- เพลง: ใช้ YouTube embed เป็นหลัก — license "royalty-free" ส่วนใหญ่ห้ามเผยแพร่เพลงแบบ standalone ซึ่งเว็บเปิดเพลงอาจเข้าข่าย
- YouTube player ต้องมองเห็นได้ ≥ 200×200px ตามเงื่อนไข embed (โหมดโฟกัสจึงซ่อนแค่ panel อื่น ไม่ซ่อน player)

## Roadmap

1. **MVP (ตอนนี้)**: ฉากคาเฟ่วันฝนตก (วิดีโอจริง + 5 เสียง), ป่ายามเช้า/ทะเลตอนกลางคืนเป็นการ์ด "เร็วๆ นี้" (`upcomingScenes` ใน `scenes.ts`), 3 สถานีเพลง, จำค่าที่ตั้งไว้รายฉาก, โหมดโฟกัส (แผงเพลงย่อเหลือปุ่มเล่น + แถบเสียง + ตัวเล่น 200×200)
2. Pomodoro timer, preset สำเร็จรูป, ไฟล์ฉาก/เสียงจริง
3. แชร์ preset ผ่าน URL, PWA, ตั้งเวลาปิดเสียง, Media Session API

## Dev

```bash
bun run dev      # http://localhost:4321
bun run build
```
