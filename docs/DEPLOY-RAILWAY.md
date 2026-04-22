# Panduan Deploy Worker ke Railway

## Prasyarat

- Akun [Railway](https://railway.app) (gratis, dapat $5 credit/bulan)
- Repo project sudah di GitHub (wajib — Railway deploy dari GitHub)
- Supabase project sudah aktif dan migration sudah dijalankan

---

## Langkah 1 — Push ke GitHub

Jika belum ada remote, buat repo baru di GitHub lalu:

```bash
cd "/Applications/Works/QuranBest/Vibe Code/WA Broadcast Tools"
git remote add origin https://github.com/USERNAME/REPO_NAME.git
git branch -M main
git push -u origin main
```

---

## Langkah 2 — Buat Project Baru di Railway

1. Buka [railway.app](https://railway.app) → klik **New Project**
2. Pilih **Deploy from GitHub repo**
3. Authorize Railway untuk akses GitHub (jika belum)
4. Pilih repo `wa-broadcast-tools`
5. Railway akan mulai detect project — **jangan deploy dulu**, kita perlu setting dulu

---

## Langkah 3 — Konfigurasi Service

Setelah repo terhubung, Railway akan membuat satu service. Masuk ke service tersebut:

### Set Root Directory

1. Klik service → tab **Settings**
2. Di bagian **Source** → **Root Directory** → isi: `apps/worker`

> Ini penting agar Railway hanya build folder worker, bukan seluruh monorepo.

### Set Start Command

Di bagian **Deploy** → **Start Command**:
```
pnpm start
```

### Build Command (jika diminta)

```
npm install -g pnpm && pnpm install --frozen-lockfile
```

---

## Langkah 4 — Set Environment Variables

Masuk ke tab **Variables** pada service, tambahkan:

| Variable | Nilai |
|---|---|
| `SUPABASE_URL` | `https://xxxxx.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGci...` (dari Supabase → Settings → API → service_role) |
| `AUTH_DIR` | `/app/auth_sessions` |
| `NODE_ENV` | `production` |

> **PENTING:** Gunakan `service_role` key (bukan `anon` key) — worker butuh akses penuh ke database tanpa RLS.

Cara mendapatkan nilai Supabase:
1. Buka [supabase.com/dashboard](https://supabase.com/dashboard)
2. Pilih project → **Settings** → **API**
3. Copy **Project URL** → isi ke `SUPABASE_URL`
4. Copy **service_role** key (klik mata untuk tampilkan) → isi ke `SUPABASE_SERVICE_ROLE_KEY`

---

## Langkah 5 — Set Volume untuk Sesi Baileys

Sesi WhatsApp (file QR dan auth) harus persisten agar tidak hilang saat Railway restart.

1. Di Railway dashboard → klik **+ New** → **Volume**
2. Attach volume ke service worker
3. Set **Mount Path**: `/app/auth_sessions`
4. Ukuran: **1 GB** cukup untuk beberapa nomor

> Tanpa volume ini, setiap kali Railway restart Anda harus scan QR ulang.

---

## Langkah 6 — Deploy

1. Klik **Deploy** atau push commit baru ke `main`
2. Railway akan menjalankan build otomatis
3. Buka tab **Deployments** → klik deployment terbaru → lihat **View Logs**

### Logs yang diharapkan saat berhasil:

```
[Worker] WA Broadcast Worker v1.0.0 started
[Worker] Poll interval: 30s
[session-manager] Tidak ada sender yang perlu diinisialisasi
[Worker] Scheduler polling dimulai
```

### Jika ada error saat build:

**Error: pnpm not found**
Tambahkan Build Command:
```
npm install -g pnpm@latest && pnpm install --no-frozen-lockfile
```

**Error: Cannot find module '@wa-broadcast/db'**
Pastikan Root Directory di-set ke `apps/worker` dan workspace packages bisa diakses. Ubah build command menjadi:
```
npm install -g pnpm@latest && cd /app && pnpm install --no-frozen-lockfile
```

---

## Langkah 7 — Tambah Sender & Scan QR

Setelah worker berjalan:

1. Buka dashboard web → halaman **Sender WA**
2. Klik **Tambah** dengan nomor WA Anda (format: `628xxxxxxxxxx`)
3. Worker otomatis init sesi Baileys → QR tersimpan ke Supabase
4. Klik **Lihat QR** di tabel — QR code akan muncul
5. Buka WhatsApp di HP → **Perangkat Tertaut** → **Tautkan Perangkat**
6. Scan QR
7. Status sender berubah dari `warmup` menjadi `warmup` (aktif, mulai hitung hari)

> QR berlaku sekitar 60 detik. Jika expired, refresh halaman dan klik Lihat QR lagi.

---

## Langkah 8 — Verifikasi Worker Berjalan

Di Railway logs, setelah scan QR berhasil:

```
[baileys] Sender <sender-id> terhubung
[session-manager] Init sesi untuk sender <sender-id>
```

Untuk memastikan scheduler berjalan, buat campaign test:
1. Import 1 kontak test di dashboard
2. Buat campaign → set jadwal = 2 menit dari sekarang
3. Pantau Railway logs — seharusnya muncul:
   ```
   [scheduler] Memulai campaign: <nama> (<id>)
   [batch] Mulai campaign <id>
   ```

---

## Monitoring & Troubleshooting

### Cek status worker
Railway dashboard → service → tab **Metrics** (CPU/Memory usage)

### Worker restart terlalu sering
Cek logs untuk error. Kemungkinan penyebab:
- Env var `SUPABASE_URL` atau `SUPABASE_SERVICE_ROLE_KEY` salah → cek tab Variables
- Baileys gagal connect ke WA server → biasanya pulih sendiri (auto-reconnect)

### QR tidak muncul di dashboard
- Pastikan volume sudah di-attach ke `/app/auth_sessions`
- Restart service Railway sekali
- Cek Supabase: tabel `sender_phones` kolom `session_data` harus terisi `{"qr": "..."}`

### Sender stuck di status `warmup`
Normal — status `warmup` artinya sesi sudah terhubung dan mulai menghitung hari. Setelah 14 hari, otomatis naik ke `active`. Anda tetap bisa jalankan campaign dengan sender `warmup`, hanya volume per hari yang dibatasi.

---

## Biaya Railway

Railway free tier memberikan **$5 credit/bulan**. Worker ini menggunakan sekitar:
- RAM: ~200-400 MB
- CPU: sangat rendah (mostly idle, spike saat kirim)
- Estimasi biaya: **~$2-3/bulan** untuk worker 24 jam

Jika credit habis, upgrade ke Hobby plan ($5/bulan) untuk kredit lebih besar.

---

## Update Worker

Setiap kali ada perubahan kode worker, cukup:

```bash
git add .
git commit -m "update: ..."
git push origin main
```

Railway otomatis detect push dan redeploy. Downtime sekitar 10-30 detik selama redeploy.
