# Contact Selection & Broadcast Status Design

**Date:** 2026-04-27  
**Status:** Approved

## Overview

Mengubah alur pemilihan kontak dari auto-assign berbasis tag menjadi pemilihan manual per campaign. User bisa memilih kontak dengan filter + checkbox, melihat status broadcast tiap kontak di detail campaign, dan melihat riwayat broadcast di halaman kontak utama.

---

## Data Model

Tidak ada perubahan skema DB. Tabel yang digunakan:

- `contacts` — daftar kontak user
- `campaign_contacts` — relasi campaign ↔ kontak, berisi `status` (pending/sending/sent/delivered/failed/skipped), `sent_at`, `error_code`
- `campaigns` — data campaign

---

## Perubahan Per Halaman

### 1. Buat Campaign Baru (`/dashboard/campaigns/new`)

**Dihapus:**
- Field "Filter Tag Kontak" — pemilihan kontak dipindah ke detail campaign
- Auto-insert ke `campaign_contacts` saat form submit

**Tetap:**
- Nama campaign, sender, tipe pesan, isi pesan, gambar, jadwal kirim
- Campaign dibuat dengan status `draft`
- Redirect ke `/dashboard/campaigns/[id]` setelah submit

### 2. Detail Campaign (`/dashboard/campaigns/[id]`)

Tambah dua section baru di bawah stats card:

**Section A — Kontak Terdaftar**
- Tabel: Nama, Nomor, Status badge, Waktu Kirim, Aksi
- Aksi "Hapus" untuk kontak berstatus `pending`
- Aksi "Retry" untuk kontak berstatus `failed` (update status → `pending`)
- Tombol "Hapus Semua Pending" untuk bulk remove
- Section bisa di-collapse

**Section B — Tambah Kontak** (client component)
- Search input (nama/nomor)
- Filter tags (dropdown, populated dari kontak user)
- Filter status aktif/opt-out/blocked
- Checkbox "Pilih Semua" hasil filter
- Checkbox per baris kontak
- Kontak yang sudah ada di campaign: disabled (tidak bisa dipilih ulang)
- Tombol "Tambahkan X kontak" → server action batch insert ke `campaign_contacts` dengan status `pending`
- Section bisa di-collapse

### 3. Halaman Kontak (`/dashboard/contacts`)

**Tambah di kolom Status:**
- Jika kontak pernah di-broadcast: tampil ikon `✓` kecil berwarna hijau di sebelah status badge
- Hover ikon → tooltip: `"Terakhir: [Nama Campaign] · [Status terakhir]"`
- Jika belum pernah di-broadcast: tidak ada ikon

**Query:**
- Join `campaign_contacts` (entry terbaru per `contact_id`) ke `campaigns` untuk nama
- Diambil sekaligus dengan query contacts utama via subquery atau separate fetch + map

---

## Komponen Baru

| File | Deskripsi |
|------|-----------|
| `app/dashboard/campaigns/[id]/contact-selector.tsx` | Client component — filter + checkbox + bulk add |
| `app/dashboard/campaigns/[id]/campaign-contact-list.tsx` | Server/client component — daftar kontak terdaftar + hapus + retry |
| `app/dashboard/campaigns/[id]/actions.ts` (baru atau extend) | Server actions: `addContactsToCampaign`, `removeContactFromCampaign`, `retryContactBroadcast` |

---

## Server Actions

### `addContactsToCampaign(campaignId, contactIds[])`
- Validasi ownership campaign
- Filter `contactIds` yang belum ada di `campaign_contacts` untuk campaign ini
- Batch insert dengan status `pending`

### `removeContactFromCampaign(campaignContactId)`
- Validasi ownership
- Hanya boleh hapus jika status `pending`
- Delete row dari `campaign_contacts`

### `retryContactBroadcast(campaignContactId)`
- Validasi ownership
- Hanya boleh jika status `failed`
- Update status → `pending`, reset `error_code` dan `retry_count`

### `removePendingContacts(campaignId)`
- Delete semua `campaign_contacts` dengan status `pending` untuk campaign ini

---

## UX Notes

- Section "Tambah Kontak" default collapsed jika campaign sudah punya kontak terdaftar
- Tombol "Tambahkan" disabled jika tidak ada kontak dipilih
- Setelah add/remove, revalidate halaman untuk refresh counts dan daftar
- Badge broadcast di halaman kontak menggunakan `title` attribute untuk tooltip (native, no extra library)
