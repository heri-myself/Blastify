# WA Broadcast Tools — Implementation Plan

## Tujuan
Aplikasi web untuk broadcast pesan ke nomor WhatsApp secara terjadwal, dengan mekanisme anti-ban dari Meta.

---

## Prinsip Anti-Ban

Meta mendeteksi pola *tidak manusiawi*. Strategi ini wajib diterapkan:

1. **WhatsApp Business API resmi (Cloud API)** — satu-satunya jalur legal & scalable
2. **Template message** untuk pesan outbound ke nomor baru (wajib approved Meta)
3. **Opt-in wajib** — simpan bukti consent tiap nomor
4. **Ramp-up bertahap** — nomor baru mulai 250 msg/hari, naik otomatis kalau quality "High"
5. **Jitter & throttling** — delay acak 2–8 detik antar pesan, max 10 msg/detik per nomor
6. **Personalisasi** — variabel nama/konten berbeda tiap pesan (spintax)
7. **Monitor quality rating** — auto-pause kalau drop ke "Medium" atau block rate tinggi
8. **Rotasi sender** — pakai beberapa phone number ID untuk distribusi beban

---

## Dua Jalur Teknologi

### Jalur A — Resmi (Rekomendasi Produksi)
- **WhatsApp Cloud API** (gratis dari Meta) atau BSP: Twilio, 360dialog, Wati
- **Pro**: tidak ada risiko ban selama patuh policy, bisa verified business
- **Con**: biaya per-conversation marketing ~Rp 275–550 di Indonesia, template perlu approval

### Jalur B — Non-Resmi (Internal/Skala Kecil, Risiko Tinggi)
- **Baileys** (Node.js, WebSocket langsung ke WA Web)
- Multi-device session, rotasi banyak nomor
- Hanya layak untuk volume kecil & audiens yang sudah kenal pengirim

---

## Arsitektur (Jalur A — Recommended)

```
Next.js (Vercel) ──► Supabase (Postgres + Auth)
      │                    │
      │                    ├─ contacts, campaigns, messages, logs
      │                    └─ RLS per user/tenant
      │
      ├─► Upstash QStash / Vercel Queues  ◄── scheduler (Vercel Cron)
      │         │
      │         └─► Vercel Function (worker)
      │                    │
      │                    ├─► WhatsApp Cloud API
      │                    └─► Update status + webhook receiver
      │
      └─► Webhook endpoint (delivered/read/failed dari Meta)
```

---

## Stack Teknologi

| Layer | Teknologi |
|---|---|
| Frontend / Dashboard | Next.js 16 App Router + shadcn/ui |
| Hosting | Vercel (Fluid Compute) |
| Database | Supabase Postgres |
| Auth | Supabase Auth atau Clerk |
| Scheduler | Vercel Cron Jobs |
| Queue / Throttling | Upstash QStash atau Vercel Queues |
| Worker | Vercel Functions |
| WhatsApp | Meta Cloud API (atau BSP) |
| Observability | Supabase logs + custom metrics table |

---

## Skema Database

### contacts
```sql
id, user_id, phone, name, tags[], opt_in_at, opt_out_at, created_at
```

### templates
```sql
id, user_id, name, wa_template_id, content, variables[], status, created_at
```

### campaigns
```sql
id, user_id, name, template_id, sender_phone_id,
scheduled_at, status (draft/scheduled/running/paused/done),
target_filter (jsonb), created_at
```

### campaign_contacts
```sql
id, campaign_id, contact_id, status (pending/sent/delivered/read/failed),
error_code, sent_at, delivered_at, read_at
```

### sender_phones
```sql
id, user_id, phone_number_id, display_name, quality_rating,
daily_limit, sent_today, paused_until, created_at
```

### delivery_logs
```sql
id, campaign_contact_id, event (sent/delivered/read/failed/blocked),
wa_message_id, payload (jsonb), created_at
```

---

## Fitur Utama

### Dashboard
- [ ] Manajemen kontak (import CSV, tag, opt-in/out tracking)
- [ ] Manajemen template (sync dari Meta, preview, status approval)
- [ ] Buat & jadwalkan campaign
- [ ] Monitor real-time: delivery rate, read rate, block rate
- [ ] Manajemen sender phones & quality tier

### Worker Anti-Ban
- [ ] Throttle per phone_number_id (max 10 msg/detik)
- [ ] Jitter acak 2–8 detik antar pesan
- [ ] Auto-pause sender kalau error rate > 5% dalam 1 jam
- [ ] Rotasi sender phones secara round-robin
- [ ] Spintax untuk variasi isi pesan
- [ ] Exclude nomor yang pernah block/report

### Webhook Handler
- [ ] Terima status callback dari Meta (delivered/read/failed)
- [ ] Update `campaign_contacts` dan `delivery_logs`
- [ ] Trigger auto-pause kalau banyak block report

---

## Endpoint API

```
POST /api/campaigns          — buat campaign
GET  /api/campaigns          — list campaigns
POST /api/campaigns/[id]/run — jalankan sekarang
POST /api/campaigns/[id]/pause — pause
GET  /api/campaigns/[id]/stats — statistik pengiriman

POST /api/contacts/import    — import CSV
GET  /api/contacts           — list dengan filter/tag

POST /api/webhook/whatsapp   — terima status dari Meta
GET  /api/webhook/whatsapp   — verifikasi webhook Meta

POST /api/worker/send        — endpoint internal dari QStash worker
```

---

## Timeline Implementasi

### Phase 1 — Foundation (Week 1–2)
- [ ] Init Next.js project + Supabase
- [ ] Auth (login/register)
- [ ] Skema database + migrasi
- [ ] Manajemen kontak (CRUD + import CSV)
- [ ] Koneksi ke Meta Cloud API (test kirim manual)

### Phase 2 — Core Broadcast (Week 3–4)
- [ ] Manajemen template (sync + approval status)
- [ ] Buat campaign + target filter
- [ ] Vercel Cron trigger campaign
- [ ] QStash worker dengan throttling & jitter
- [ ] Webhook handler status callback

### Phase 3 — Anti-Ban & Monitoring (Week 5–6)
- [ ] Auto-pause logic berdasarkan quality rating
- [ ] Rotasi sender phones
- [ ] Spintax engine
- [ ] Dashboard analytics real-time
- [ ] Alert kalau block rate tinggi

### Phase 4 — Polish (Week 7–8)
- [ ] Multi-tenant (multiple users/teams)
- [ ] Audit log & export laporan
- [ ] Retry failed messages
- [ ] A/B testing template

---

## Catatan Penting

- **Jangan kirim ke nomor tanpa opt-in** — langsung trigger report dari user
- **Waktu kirim optimal**: jam 09.00–11.00 dan 14.00–16.00 WIB
- **Hindari hari libur** untuk pesan marketing
- **Quality Rating Meta**: High (hijau) = aman, Medium (kuning) = warning, Low (merah) = risiko disable
- Simpan semua consent + history kirim minimal 1 tahun untuk compliance
