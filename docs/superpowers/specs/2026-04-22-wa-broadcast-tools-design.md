# WA Broadcast Tools — Design Spec
**Date:** 2026-04-22  
**Status:** Approved  

---

## Overview

Aplikasi web untuk broadcast pesan WhatsApp secara terjadwal menggunakan Baileys (unofficial WA Web library). Target skala kecil (<500 pesan/hari), 2 nomor sender, mendukung pesan teks + gambar + tombol, dengan strategi anti-ban berlapis.

---

## Arsitektur

```
┌─────────────────────────────────────────┐
│           VERCEL (Next.js)              │
│  Dashboard UI + API Routes              │
│  - Manajemen kontak                     │
│  - Buat & jadwalkan campaign            │
│  - Statistik real-time                  │
└──────────────┬──────────────────────────┘
               │ read/write
               ▼
┌─────────────────────────────────────────┐
│           SUPABASE                      │
│  Postgres + Realtime + Storage          │
│  - contacts, campaigns, messages        │
│  - queue tabel (pending jobs)           │
│  - delivery logs                        │
│  - media files (gambar/dokumen)         │
└──────────────┬──────────────────────────┘
               │ polling setiap 30 detik
               ▼
┌─────────────────────────────────────────┐
│         RAILWAY (Node.js Worker)        │
│  Baileys Service (persistent process)  │
│  - 2 sesi WA aktif (rotasi)             │
│  - Throttle + jitter anti-ban           │
│  - Spintax engine                       │
│  - Kirim teks, gambar, tombol           │
│  - Monitor & auto-recovery soft ban     │
│  - Update status ke Supabase            │
└─────────────────────────────────────────┘
```

**Alur kerja:**
1. User buat campaign di dashboard (Vercel) → simpan ke Supabase dengan status `scheduled`
2. Railway worker polling Supabase setiap 30 detik
3. Worker deteksi campaign dengan `scheduled_at <= now` → mulai proses
4. Kirim batch dengan throttle + jitter, update status tiap pesan
5. Dashboard update real-time via Supabase Realtime (tanpa refresh)

---

## Tech Stack

| Komponen | Teknologi |
|---|---|
| Frontend | Next.js 16 App Router + shadcn/ui + Tailwind CSS |
| Auth | Supabase Auth |
| Database | Supabase Postgres |
| Media Storage | Supabase Storage (gratis hingga 1GB) |
| Realtime | Supabase Realtime |
| Worker | Node.js + TypeScript |
| WA Library | Baileys (latest) |
| Hosting Web | Vercel (free tier) |
| Hosting Worker | Railway ($5 credit/bulan) |
| Monorepo | pnpm workspaces |

---

## Struktur Folder

```
wa-broadcast-tools/
├── apps/
│   ├── web/                    # Next.js di Vercel
│   │   ├── app/
│   │   │   ├── (auth)/         # login, register
│   │   │   ├── dashboard/      # overview statistik
│   │   │   ├── contacts/       # manajemen kontak
│   │   │   ├── campaigns/      # buat & kelola campaign
│   │   │   ├── senders/        # kelola nomor WA
│   │   │   ├── media/          # upload & kelola media
│   │   │   └── api/            # API routes
│   │   └── components/
│   │
│   └── worker/                 # Node.js di Railway
│       ├── src/
│       │   ├── baileys/        # koneksi & sesi WA
│       │   ├── scheduler/      # polling Supabase & trigger campaign
│       │   ├── sender/         # kirim pesan + throttle + jitter
│       │   ├── antiban/        # monitor & recovery logic
│       │   ├── spintax/        # engine variasi pesan
│       │   └── warmup/         # warmup protocol
│       └── index.ts
│
└── packages/
    └── db/                     # shared Supabase types & queries
```

---

## Skema Database

### `sender_phones`
```sql
id uuid PRIMARY KEY,
user_id uuid REFERENCES auth.users,
phone_number text NOT NULL,
display_name text,
status text CHECK (status IN ('active','soft_banned','recovering','warmup','disabled')),
consecutive_failures int DEFAULT 0,
banned_at timestamptz,
recover_at timestamptz,
warmup_day int DEFAULT 0,
daily_sent int DEFAULT 0,
last_sent_at timestamptz,
session_data jsonb,  -- Baileys auth credentials (terenkripsi)
created_at timestamptz DEFAULT now()
```

### `contacts`
```sql
id uuid PRIMARY KEY,
user_id uuid REFERENCES auth.users,
phone text NOT NULL,
name text,
tags text[],
extra_data jsonb,       -- data custom: kota, produk, dsb
opt_in_at timestamptz,
opt_out_at timestamptz,
last_received_at timestamptz,
is_blocked bool DEFAULT false,
created_at timestamptz DEFAULT now()
```

### `media_files`
```sql
id uuid PRIMARY KEY,
user_id uuid REFERENCES auth.users,
filename text,
storage_path text,      -- path di Supabase Storage
public_url text,
file_type text CHECK (file_type IN ('image','document','video')),
file_size int,
created_at timestamptz DEFAULT now()
```

### `campaigns`
```sql
id uuid PRIMARY KEY,
user_id uuid REFERENCES auth.users,
name text NOT NULL,
status text CHECK (status IN ('draft','scheduled','running','paused','done','failed')),
scheduled_at timestamptz,
started_at timestamptz,
finished_at timestamptz,
target_filter jsonb,    -- filter berdasarkan tag/custom field
sender_rotation jsonb,  -- daftar sender_phone_id yang dipakai
created_at timestamptz DEFAULT now()
```

### `campaign_messages`
```sql
id uuid PRIMARY KEY,
campaign_id uuid REFERENCES campaigns,
order_index int DEFAULT 0,
type text CHECK (type IN ('text','image','document','button')),
content text,           -- teks, support spintax {opsi1|opsi2}
media_url text,         -- public_url dari media_files
buttons jsonb           -- [{text, url}]
```

### `campaign_contacts`
```sql
id uuid PRIMARY KEY,
campaign_id uuid REFERENCES campaigns,
contact_id uuid REFERENCES contacts,
sender_phone_id uuid REFERENCES sender_phones,
status text CHECK (status IN ('pending','sending','sent','delivered','failed','skipped')),
scheduled_at timestamptz,
sent_at timestamptz,
delivered_at timestamptz,
error_code text,
retry_count int DEFAULT 0,
CONSTRAINT max_retry CHECK (retry_count <= 2)
```

### `delivery_logs`
```sql
id uuid PRIMARY KEY,
campaign_contact_id uuid REFERENCES campaign_contacts,
event text,             -- sent, delivered, failed, blocked, retry
details jsonb,
created_at timestamptz DEFAULT now()
```

---

## Status Flow

```
campaign_contacts.status:
pending → sending → sent → delivered ✓
                         → failed → retry (max 2x) → skipped
                  → skipped (opt-out / is_blocked = true)

campaigns.status:
draft → scheduled → running → done ✓
                  → paused (manual atau auto-pause anti-ban)
                  → failed (semua sender tidak tersedia)
```

---

## Anti-Ban Strategy

### Layer 1 — Throttling & Jitter
- Max 20 pesan/menit per nomor sender
- Jeda acak 3–8 detik antar pesan
- Setelah 50 pesan: istirahat 2–5 menit sebelum lanjut

### Layer 2 — Rotasi 2 Nomor Sender
- Round-robin per batch 50 pesan
- Jika nomor A error/ban → otomatis pause, traffic pindah ke nomor B
- Alert ke dashboard kalau salah satu nomor bermasalah

### Layer 3 — Spintax Engine
- Template: `Halo {nama}! {Promo ini|Penawaran ini} {khusus untuk Anda|sayang dilewatkan}!`
- Variabel dari data kontak: `{nama}`, `{kota}`, field custom
- Setiap pesan di-render berbeda, hindari duplikasi 100%

### Layer 4 — Waktu Kirim Cerdas
- Hanya kirim di jam 08.00–21.00 WIB
- Hindari kirim lebih dari 1x per 24 jam ke nomor yang sama
- Queue tunda otomatis jika di luar jam aman

### Layer 5 — Monitor & Auto-Pause
- Jika >3 pesan gagal berturut-turut dari satu sender → pause sender 30 menit
- Jika error rate >10% dalam satu batch → stop campaign, notif dashboard
- Log semua event: sent, delivered, failed, blocked

---

## Soft-Ban Recovery Protocol

| Tipe | Deteksi | Tindakan |
|---|---|---|
| Soft Ban L1 | 5 pesan berturut-turut 1 centang | Istirahat 48 jam, pindah ke nomor B |
| Soft Ban L2 | Gagal kirim ke nomor baru | Istirahat 7 hari, pindah ke nomor B |
| Temporary Block | Baileys error auth | Manual review, nomor B ambil alih |
| Permanent Ban | Session invalid permanen | Alert user, promosi nomor cadangan |

### Warmup Protocol (Nomor Baru / Recovered)
```
Hari 1–3:   max 20 pesan/hari  (kontak yang sudah simpan nomor)
Hari 4–7:   max 50 pesan/hari
Hari 8–14:  max 150 pesan/hari
Hari 15+:   normal, max 500 pesan/hari
```

---

## Halaman Dashboard

| Halaman | Fitur |
|---|---|
| **Overview** | Total terkirim hari ini, success rate, status nomor aktif |
| **Contacts** | Import CSV, filter tag, lihat history per kontak, opt-out management |
| **Campaigns** | Buat campaign, pilih template + media, set jadwal, monitor progress real-time |
| **Senders** | Status 2 nomor WA, scan QR Baileys, warmup progress, recovery timer |
| **Media** | Upload gambar/dokumen ke Supabase Storage, preview, copy URL |

---

## Batasan & Risiko

- Baileys adalah library tidak resmi — Meta dapat memperbarui protokol WA kapan saja
- Tidak ada jaminan 100% bebas ban — strategi anti-ban hanya meminimalkan risiko
- Supabase free tier: 500MB database, 1GB storage, 2GB bandwidth/bulan
- Railway free tier: $5 credit/bulan (~500 jam compute)
- Nomor WA yang digunakan sebaiknya nomor WA Business, bukan personal
