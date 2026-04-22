# WA Broadcast Tools — Plan 3: Railway Worker (Baileys)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bangun Railway worker yang menjalankan Baileys untuk mengirim pesan WhatsApp dengan throttling, jitter, rotasi sender, spintax, warmup protocol, dan auto-recovery soft ban.

**Architecture:** Satu proses Node.js persisten yang polling Supabase setiap 30 detik untuk campaign terjadwal. Baileys mengelola sesi WA per sender phone. Anti-ban diimplementasi sebagai middleware di layer pengiriman.

**Tech Stack:** Node.js 20, TypeScript, Baileys (latest), @supabase/supabase-js v2, tsx (dev), Railway (hosting)

**Prerequisite:** Plan 1 & 2 sudah selesai. Supabase project aktif dengan semua tabel terbuat.

---

## File Structure

```
apps/worker/
├── package.json
├── tsconfig.json
├── railway.json                      # Railway config
└── src/
    ├── index.ts                      # entry point, start scheduler loop
    ├── config.ts                     # env vars & constants
    ├── supabase.ts                   # Supabase client (service role)
    ├── baileys/
    │   ├── session-manager.ts        # kelola sesi Baileys per sender
    │   └── connect.ts                # buat koneksi WA, handle QR
    ├── scheduler/
    │   └── poll.ts                   # polling campaigns terjadwal
    ├── sender/
    │   ├── send-message.ts           # kirim satu pesan via Baileys
    │   └── batch-runner.ts           # proses satu campaign (loop kontak)
    ├── antiban/
    │   ├── throttle.ts               # rate limiting & jitter per sender
    │   ├── monitor.ts                # deteksi kegagalan & auto-pause
    │   └── warmup.ts                 # batasan harian sesuai hari warmup
    └── spintax/
        └── render.ts                 # render spintax + variabel kontak
```

---

### Task 1: Setup Dependencies Worker

**Files:**
- Modify: `apps/worker/package.json`
- Create: `apps/worker/src/config.ts`
- Create: `apps/worker/src/supabase.ts`

- [ ] **Step 1: Update apps/worker/package.json**

```json
{
  "name": "worker",
  "version": "1.0.0",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "start": "node --loader tsx/esm src/index.ts",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.47.0",
    "@wa-broadcast/db": "workspace:*",
    "@whiskeysockets/baileys": "^6.7.0",
    "pino": "^9.0.0"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "tsx": "^4.19.0",
    "typescript": "^5.7.0"
  }
}
```

- [ ] **Step 2: Install dependencies**

```bash
cd "/Applications/Works/QuranBest/Vibe Code/WA Broadcast Tools"
pnpm install
```

- [ ] **Step 3: Buat apps/worker/src/config.ts**

```typescript
export const config = {
  supabaseUrl: process.env.SUPABASE_URL!,
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,

  // Anti-ban settings
  minDelayMs: 3_000,       // jeda minimum antar pesan (ms)
  maxDelayMs: 8_000,       // jeda maksimum antar pesan (ms)
  batchSize: 50,           // pesan per batch sebelum istirahat sender
  batchRestMinMs: 120_000, // istirahat minimum setelah batch (ms)
  batchRestMaxMs: 300_000, // istirahat maksimum setelah batch (ms)
  maxMsgPerMinute: 20,     // batas per menit per sender
  pauseOnFailures: 3,      // consecutive failures sebelum pause sender
  pauseDurationMs: 1_800_000, // durasi pause sender (30 menit)
  errorRateThreshold: 0.10,   // error rate (10%) untuk stop campaign

  // Scheduler
  pollIntervalMs: 30_000,   // interval polling Supabase (ms)

  // Warm-up limits per hari (index = hari ke-0)
  warmupLimits: [20, 20, 20, 50, 50, 50, 50, 150, 150, 150, 150, 150, 150, 150, 500],
  // Hari 1-3: 20/hari, hari 4-7: 50/hari, hari 8-14: 150/hari, hari 15+: 500/hari

  // Jam aman kirim (WIB = UTC+7)
  safeSendStartHour: 8,  // 08.00 WIB
  safeSendEndHour: 21,   // 21.00 WIB
}

// Validasi env vars saat startup
const required = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY']
for (const key of required) {
  if (!process.env[key]) throw new Error(`Missing required env var: ${key}`)
}
```

- [ ] **Step 4: Buat apps/worker/src/supabase.ts**

```typescript
import { createClient } from '@supabase/supabase-js'
import { config } from './config'

export const supabase = createClient(config.supabaseUrl, config.supabaseServiceKey, {
  auth: { persistSession: false }
})
```

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "feat: setup worker dependencies and config"
```

---

### Task 2: Spintax Engine

**Files:**
- Create: `apps/worker/src/spintax/render.ts`

- [ ] **Step 1: Buat apps/worker/src/spintax/render.ts**

```typescript
/**
 * Render pesan dengan spintax dan variabel kontak.
 *
 * Spintax: {opsi1|opsi2|opsi3} → pilih satu secara acak
 * Variabel: {nama} → diganti dari contactData
 *
 * Contoh:
 *   renderMessage('Halo {nama}! {Promo|Penawaran} spesial!', { nama: 'Budi' })
 *   → 'Halo Budi! Promo spesial!' atau 'Halo Budi! Penawaran spesial!'
 */
export function renderMessage(
  template: string,
  contactData: Record<string, string>
): string {
  // Proses spintax terlebih dahulu (rekursif untuk nested)
  let result = resolveSpintax(template)

  // Ganti variabel kontak
  for (const [key, value] of Object.entries(contactData)) {
    result = result.replaceAll(`{${key}}`, value)
  }

  // Hapus variabel yang tidak terganti
  result = result.replace(/\{[^|{}]+\}/g, '')

  return result.trim()
}

function resolveSpintax(text: string): string {
  // Temukan {opsi1|opsi2} yang paling dalam (tanpa nested {})
  const pattern = /\{([^{}]+)\}/g
  let result = text
  let match: RegExpExecArray | null

  while ((match = pattern.exec(result)) !== null) {
    const full = match[0]
    const inner = match[1]

    // Hanya proses jika berisi | (spintax), bukan variabel kontak
    if (inner.includes('|')) {
      const options = inner.split('|')
      const chosen = options[Math.floor(Math.random() * options.length)]
      result = result.replace(full, chosen)
      // Reset untuk cari lagi dari awal karena string berubah
      pattern.lastIndex = 0
    }
  }

  return result
}
```

- [ ] **Step 2: Test manual spintax**

Buat file sementara `apps/worker/src/spintax/render.test.ts`:

```typescript
import { renderMessage } from './render'

// Test 1: spintax dasar
const r1 = renderMessage('{Halo|Hi} {nama}!', { nama: 'Budi' })
console.assert(r1 === 'Halo Budi!' || r1 === 'Hi Budi!', `Test 1 gagal: ${r1}`)

// Test 2: tanpa spintax
const r2 = renderMessage('Halo {nama}!', { nama: 'Siti' })
console.assert(r2 === 'Halo Siti!', `Test 2 gagal: ${r2}`)

// Test 3: variabel tidak ada → dihapus
const r3 = renderMessage('Halo {nama}!', {})
console.assert(r3 === 'Halo !', `Test 3 gagal: ${r3}`)

// Test 4: multiple spintax
const r4 = renderMessage('{A|B} dan {C|D}', {})
console.assert(['A dan C', 'A dan D', 'B dan C', 'B dan D'].includes(r4), `Test 4 gagal: ${r4}`)

console.log('Semua test spintax lulus ✓')
```

```bash
cd "/Applications/Works/QuranBest/Vibe Code/WA Broadcast Tools"
pnpm --filter worker exec tsx src/spintax/render.test.ts
# Expected: Semua test spintax lulus ✓
```

- [ ] **Step 3: Hapus file test sementara**

```bash
rm "/Applications/Works/QuranBest/Vibe Code/WA Broadcast Tools/apps/worker/src/spintax/render.test.ts"
```

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "feat: add spintax engine with contact variable substitution"
```

---

### Task 3: Warmup & Throttle

**Files:**
- Create: `apps/worker/src/antiban/warmup.ts`
- Create: `apps/worker/src/antiban/throttle.ts`

- [ ] **Step 1: Buat apps/worker/src/antiban/warmup.ts**

```typescript
import { config } from '../config'
import { supabase } from '../supabase'
import type { SenderPhone } from '@wa-broadcast/db'

/**
 * Cek apakah sender boleh kirim berdasarkan warmup limit dan jam aman.
 * Return null jika boleh, atau string alasan jika tidak boleh.
 */
export async function checkSendAllowed(sender: SenderPhone): Promise<string | null> {
  // Cek jam aman (WIB = UTC+7)
  const nowWIB = new Date(Date.now() + 7 * 60 * 60 * 1000)
  const hour = nowWIB.getUTCHours()
  if (hour < config.safeSendStartHour || hour >= config.safeSendEndHour) {
    return `Di luar jam aman (${config.safeSendStartHour}:00–${config.safeSendEndHour}:00 WIB)`
  }

  // Cek status sender
  if (sender.status === 'disabled') return 'Sender disabled'
  if (sender.status === 'soft_banned') {
    if (sender.recover_at && new Date(sender.recover_at) > new Date()) {
      return `Soft banned sampai ${sender.recover_at}`
    }
    // Masa recovery selesai, set ke warmup
    await supabase.from('sender_phones').update({
      status: 'recovering',
      consecutive_failures: 0,
    }).eq('id', sender.id)
    return null
  }

  // Cek daily limit berdasarkan warmup day
  const limit = getWarmupLimit(sender.warmup_day)
  if (sender.daily_sent >= limit) {
    return `Sudah mencapai limit harian (${sender.daily_sent}/${limit})`
  }

  return null
}

export function getWarmupLimit(warmupDay: number): number {
  const idx = Math.min(warmupDay, config.warmupLimits.length - 1)
  return config.warmupLimits[idx]
}

/**
 * Reset daily_sent setiap hari, increment warmup_day.
 * Panggil sekali saat worker start dan setiap tengah malam.
 */
export async function resetDailyCounters(): Promise<void> {
  await supabase.from('sender_phones')
    .update({
      daily_sent: 0,
    })
    .neq('status', 'disabled')

  // Increment warmup_day untuk sender yang masih warmup (< 14 hari)
  await supabase.from('sender_phones')
    .update({ warmup_day: supabase.rpc('increment', { x: 1 }) as unknown as number })
    .eq('status', 'warmup')
    .lt('warmup_day', 14)

  // Sender yang warmup_day >= 14 → naik ke active
  await supabase.from('sender_phones')
    .update({ status: 'active' })
    .eq('status', 'warmup')
    .gte('warmup_day', 14)
}
```

- [ ] **Step 2: Buat Supabase function untuk increment (jalankan di Supabase SQL editor)**

```sql
CREATE OR REPLACE FUNCTION increment(x int)
RETURNS int AS $$
  SELECT $1 + 1
$$ LANGUAGE sql;
```

Jalankan query ini di Supabase Dashboard → SQL Editor.

- [ ] **Step 3: Buat apps/worker/src/antiban/throttle.ts**

```typescript
import { config } from '../config'

interface SenderThrottle {
  sentInWindow: number
  windowStartMs: number
  lastSentMs: number
}

const throttleMap = new Map<string, SenderThrottle>()

/**
 * Tunggu sebelum kirim pesan berikutnya (jitter + rate limit).
 * Blok hingga aman untuk kirim.
 */
export async function waitForSlot(senderId: string): Promise<void> {
  const now = Date.now()
  const state = throttleMap.get(senderId) ?? {
    sentInWindow: 0,
    windowStartMs: now,
    lastSentMs: 0,
  }

  // Reset window tiap 60 detik
  if (now - state.windowStartMs > 60_000) {
    state.sentInWindow = 0
    state.windowStartMs = now
  }

  // Jika sudah mencapai max per menit, tunggu sisa window
  if (state.sentInWindow >= config.maxMsgPerMinute) {
    const waitMs = 60_000 - (now - state.windowStartMs) + 1_000
    await sleep(waitMs)
    state.sentInWindow = 0
    state.windowStartMs = Date.now()
  }

  // Jitter acak antara minDelay dan maxDelay sejak pesan terakhir
  const elapsed = Date.now() - state.lastSentMs
  const targetDelay = randomBetween(config.minDelayMs, config.maxDelayMs)
  if (elapsed < targetDelay) {
    await sleep(targetDelay - elapsed)
  }

  state.sentInWindow++
  state.lastSentMs = Date.now()
  throttleMap.set(senderId, state)
}

/**
 * Istirahat panjang setelah satu batch selesai.
 */
export async function batchRest(): Promise<void> {
  const ms = randomBetween(config.batchRestMinMs, config.batchRestMaxMs)
  console.log(`[throttle] Batch rest ${Math.round(ms / 1000)}s`)
  await sleep(ms)
}

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}
```

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "feat: add warmup limits and throttle/jitter logic"
```

---

### Task 4: Anti-Ban Monitor

**Files:**
- Create: `apps/worker/src/antiban/monitor.ts`

- [ ] **Step 1: Buat apps/worker/src/antiban/monitor.ts**

```typescript
import { config } from '../config'
import { supabase } from '../supabase'
import type { SenderPhone } from '@wa-broadcast/db'

/**
 * Catat pesan berhasil dikirim dari sender.
 */
export async function recordSuccess(sender: SenderPhone): Promise<void> {
  await supabase.from('sender_phones').update({
    consecutive_failures: 0,
    daily_sent: sender.daily_sent + 1,
    last_sent_at: new Date().toISOString(),
  }).eq('id', sender.id)
}

/**
 * Catat kegagalan pengiriman. Jika melewati threshold → pause sender.
 * Return true jika sender di-pause.
 */
export async function recordFailure(
  sender: SenderPhone,
  errorCode: string
): Promise<boolean> {
  const newFailures = sender.consecutive_failures + 1

  if (newFailures >= config.pauseOnFailures) {
    const recoverAt = new Date(Date.now() + config.pauseDurationMs).toISOString()
    await supabase.from('sender_phones').update({
      status: 'soft_banned',
      consecutive_failures: newFailures,
      banned_at: new Date().toISOString(),
      recover_at: recoverAt,
    }).eq('id', sender.id)
    console.log(`[monitor] Sender ${sender.phone_number} di-pause sampai ${recoverAt} (${newFailures} kegagalan)`)
    return true
  }

  await supabase.from('sender_phones').update({
    consecutive_failures: newFailures,
  }).eq('id', sender.id)
  return false
}

/**
 * Cek apakah error rate campaign melebihi threshold.
 * Return true jika campaign harus dihentikan.
 */
export async function checkCampaignErrorRate(campaignId: string): Promise<boolean> {
  const { data } = await supabase
    .from('campaign_contacts')
    .select('status')
    .eq('campaign_id', campaignId)
    .in('status', ['sent', 'delivered', 'failed'])

  if (!data || data.length < 10) return false // belum cukup data

  const failed = data.filter(d => d.status === 'failed').length
  const rate = failed / data.length

  if (rate > config.errorRateThreshold) {
    await supabase.from('campaigns').update({
      status: 'paused',
    }).eq('id', campaignId)
    console.log(`[monitor] Campaign ${campaignId} di-pause: error rate ${Math.round(rate * 100)}%`)
    return true
  }

  return false
}

/**
 * Pilih sender terbaik yang tersedia untuk campaign.
 * Prioritas: active > recovering > warmup
 */
export async function pickBestSender(
  senderIds: string[]
): Promise<SenderPhone | null> {
  const { data: senders } = await supabase
    .from('sender_phones')
    .select('*')
    .in('id', senderIds)
    .in('status', ['active', 'recovering', 'warmup'])
    .order('daily_sent', { ascending: true })

  if (!senders?.length) return null

  // Pilih sender yang belum mencapai limit
  for (const sender of senders) {
    const { checkSendAllowed } = await import('./warmup')
    const reason = await checkSendAllowed(sender as SenderPhone)
    if (!reason) return sender as SenderPhone
  }

  return null
}
```

- [ ] **Step 2: Commit**

```bash
git add .
git commit -m "feat: add anti-ban monitor with failure tracking and auto-pause"
```

---

### Task 5: Baileys Session Manager

**Files:**
- Create: `apps/worker/src/baileys/connect.ts`
- Create: `apps/worker/src/baileys/session-manager.ts`

- [ ] **Step 1: Buat apps/worker/src/baileys/connect.ts**

```typescript
import {
  makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
} from '@whiskeysockets/baileys'
import { Boom } from '@hapi/boom'
import { join } from 'path'
import { supabase } from '../supabase'
import pino from 'pino'

const logger = pino({ level: 'warn' })

export type WASocket = ReturnType<typeof makeWASocket>

const AUTH_DIR = process.env.AUTH_DIR ?? join(process.cwd(), 'auth_sessions')

/**
 * Buat koneksi Baileys untuk satu sender.
 * onQR dipanggil dengan QR string saat perlu scan.
 * onReady dipanggil saat koneksi berhasil.
 */
export async function createWAConnection(
  senderId: string,
  onQR: (qr: string) => void,
  onReady: () => void,
  onDisconnect: (shouldReconnect: boolean) => void
): Promise<WASocket> {
  const authPath = join(AUTH_DIR, senderId)
  const { state, saveCreds } = await useMultiFileAuthState(authPath)
  const { version } = await fetchLatestBaileysVersion()

  const sock = makeWASocket({
    version,
    logger,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, logger),
    },
    printQRInTerminal: false,
    generateHighQualityLinkPreview: false,
  })

  sock.ev.on('creds.update', saveCreds)

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update

    if (qr) {
      onQR(qr)
      // Simpan QR ke Supabase agar dashboard bisa tampilkan
      await supabase.from('sender_phones').update({
        session_data: { qr, qr_at: new Date().toISOString() }
      }).eq('id', senderId)
    }

    if (connection === 'open') {
      console.log(`[baileys] Sender ${senderId} terhubung`)
      // Hapus QR dari DB
      await supabase.from('sender_phones').update({
        session_data: { connected: true },
        status: 'warmup',
      }).eq('id', senderId)
      onReady()
    }

    if (connection === 'close') {
      const reason = (lastDisconnect?.error as Boom)?.output?.statusCode
      const shouldReconnect = reason !== DisconnectReason.loggedOut
      console.log(`[baileys] Sender ${senderId} disconnect (reason: ${reason}, reconnect: ${shouldReconnect})`)
      if (!shouldReconnect) {
        await supabase.from('sender_phones').update({
          status: 'disabled',
          session_data: { disconnected: true }
        }).eq('id', senderId)
      }
      onDisconnect(shouldReconnect)
    }
  })

  return sock
}
```

- [ ] **Step 2: Buat apps/worker/src/baileys/session-manager.ts**

```typescript
import { createWAConnection, type WASocket } from './connect'
import { supabase } from '../supabase'

interface Session {
  sock: WASocket
  senderId: string
  ready: boolean
}

const sessions = new Map<string, Session>()
const reconnectTimers = new Map<string, NodeJS.Timeout>()

/**
 * Inisialisasi sesi Baileys untuk semua sender dari Supabase.
 */
export async function initAllSessions(): Promise<void> {
  const { data: senders } = await supabase
    .from('sender_phones')
    .select('id, phone_number, status')
    .neq('status', 'disabled')

  if (!senders?.length) {
    console.log('[session-manager] Tidak ada sender yang perlu diinisialisasi')
    return
  }

  for (const sender of senders) {
    await initSession(sender.id)
  }
}

export async function initSession(senderId: string): Promise<void> {
  if (sessions.has(senderId)) return

  console.log(`[session-manager] Init sesi untuk sender ${senderId}`)

  const sock = await createWAConnection(
    senderId,
    (qr) => console.log(`[session-manager] QR untuk ${senderId}: ${qr.substring(0, 30)}...`),
    () => {
      const session = sessions.get(senderId)
      if (session) session.ready = true
    },
    (shouldReconnect) => {
      sessions.delete(senderId)
      if (shouldReconnect) {
        const delay = 15_000 + Math.random() * 15_000
        const timer = setTimeout(() => initSession(senderId), delay)
        reconnectTimers.set(senderId, timer)
      }
    }
  )

  sessions.set(senderId, { sock, senderId, ready: false })
}

/**
 * Ambil socket yang siap untuk sender tertentu.
 */
export function getReadySocket(senderId: string): WASocket | null {
  const session = sessions.get(senderId)
  if (!session?.ready) return null
  return session.sock
}

/**
 * Cek apakah sender punya sesi aktif dan siap.
 */
export function isSessionReady(senderId: string): boolean {
  return sessions.get(senderId)?.ready ?? false
}
```

- [ ] **Step 3: Commit**

```bash
git add .
git commit -m "feat: add Baileys session manager with auto-reconnect"
```

---

### Task 6: Send Message

**Files:**
- Create: `apps/worker/src/sender/send-message.ts`

- [ ] **Step 1: Buat apps/worker/src/sender/send-message.ts**

```typescript
import { getReadySocket } from '../baileys/session-manager'
import { waitForSlot } from '../antiban/throttle'
import { recordSuccess, recordFailure } from '../antiban/monitor'
import { renderMessage } from '../spintax/render'
import { supabase } from '../supabase'
import type { SenderPhone, Contact, CampaignMessage } from '@wa-broadcast/db'

export interface SendResult {
  success: boolean
  errorCode?: string
}

/**
 * Kirim satu pesan ke satu kontak menggunakan sender yang ditentukan.
 */
export async function sendMessage(
  campaignContactId: string,
  sender: SenderPhone,
  contact: Contact,
  message: CampaignMessage
): Promise<SendResult> {
  const sock = getReadySocket(sender.id)
  if (!sock) {
    return { success: false, errorCode: 'SESSION_NOT_READY' }
  }

  // Render konten pesan dengan spintax + variabel kontak
  const contactData: Record<string, string> = {
    nama: contact.name ?? '',
    phone: contact.phone,
    ...(contact.extra_data as Record<string, string> ?? {}),
  }
  const renderedContent = message.content
    ? renderMessage(message.content, contactData)
    : ''

  // Throttle: tunggu slot yang aman
  await waitForSlot(sender.id)

  // Update status ke 'sending'
  await supabase.from('campaign_contacts').update({
    status: 'sending',
    sender_phone_id: sender.id,
  }).eq('id', campaignContactId)

  try {
    const jid = `${contact.phone}@s.whatsapp.net`

    if (message.type === 'text') {
      await sock.sendMessage(jid, { text: renderedContent })
    } else if (message.type === 'image' && message.media_url) {
      await sock.sendMessage(jid, {
        image: { url: message.media_url },
        caption: renderedContent,
      })
    } else if (message.type === 'document' && message.media_url) {
      await sock.sendMessage(jid, {
        document: { url: message.media_url },
        caption: renderedContent,
        fileName: 'dokumen.pdf',
      })
    } else {
      await sock.sendMessage(jid, { text: renderedContent })
    }

    // Catat sukses
    await recordSuccess(sender)
    await supabase.from('campaign_contacts').update({
      status: 'sent',
      sent_at: new Date().toISOString(),
    }).eq('id', campaignContactId)
    await supabase.from('delivery_logs').insert({
      campaign_contact_id: campaignContactId,
      event: 'sent',
      details: { sender_id: sender.id },
    })

    return { success: true }
  } catch (err) {
    const errorCode = (err as Error).message ?? 'UNKNOWN_ERROR'
    const paused = await recordFailure(sender, errorCode)

    await supabase.from('campaign_contacts').update({
      status: 'failed',
      error_code: errorCode,
    }).eq('id', campaignContactId)
    await supabase.from('delivery_logs').insert({
      campaign_contact_id: campaignContactId,
      event: 'failed',
      details: { error: errorCode, sender_paused: paused },
    })

    return { success: false, errorCode }
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add .
git commit -m "feat: add send-message with throttle, spintax, and delivery logging"
```

---

### Task 7: Batch Runner

**Files:**
- Create: `apps/worker/src/sender/batch-runner.ts`

- [ ] **Step 1: Buat apps/worker/src/sender/batch-runner.ts**

```typescript
import { supabase } from '../supabase'
import { sendMessage } from './send-message'
import { pickBestSender, checkCampaignErrorRate } from '../antiban/monitor'
import { batchRest } from '../antiban/throttle'
import { config } from '../config'
import type { SenderPhone, Contact, CampaignMessage } from '@wa-broadcast/db'

/**
 * Proses satu campaign: ambil semua kontak pending, kirim batch per batch.
 */
export async function runCampaign(campaignId: string): Promise<void> {
  console.log(`[batch] Mulai campaign ${campaignId}`)

  // Set status campaign ke running
  await supabase.from('campaigns').update({
    status: 'running',
    started_at: new Date().toISOString(),
  }).eq('id', campaignId)

  // Ambil pesan campaign
  const { data: messages } = await supabase
    .from('campaign_messages')
    .select('*')
    .eq('campaign_id', campaignId)
    .order('order_index')

  if (!messages?.length) {
    console.log(`[batch] Campaign ${campaignId} tidak punya pesan`)
    await supabase.from('campaigns').update({ status: 'failed' }).eq('id', campaignId)
    return
  }

  const message = messages[0] as CampaignMessage

  // Ambil sender rotation dari campaign
  const { data: campaign } = await supabase
    .from('campaigns')
    .select('sender_rotation')
    .eq('id', campaignId)
    .single()

  const senderIds: string[] = campaign?.sender_rotation ?? []

  let batchCount = 0
  let totalSent = 0

  while (true) {
    // Cek apakah campaign masih running (bisa di-pause dari dashboard)
    const { data: currentCampaign } = await supabase
      .from('campaigns')
      .select('status')
      .eq('id', campaignId)
      .single()

    if (currentCampaign?.status !== 'running') {
      console.log(`[batch] Campaign ${campaignId} dihentikan (status: ${currentCampaign?.status})`)
      return
    }

    // Ambil batch kontak pending
    const { data: batch } = await supabase
      .from('campaign_contacts')
      .select('id, contact_id, retry_count')
      .eq('campaign_id', campaignId)
      .eq('status', 'pending')
      .limit(config.batchSize)

    if (!batch?.length) {
      console.log(`[batch] Campaign ${campaignId} selesai (${totalSent} terkirim)`)
      await supabase.from('campaigns').update({
        status: 'done',
        finished_at: new Date().toISOString(),
      }).eq('id', campaignId)
      return
    }

    // Pilih sender terbaik
    const sender = await pickBestSender(senderIds)
    if (!sender) {
      console.log(`[batch] Tidak ada sender tersedia untuk campaign ${campaignId}, tunggu 5 menit`)
      await new Promise(r => setTimeout(r, 5 * 60 * 1000))
      continue
    }

    // Kirim satu per satu dalam batch
    for (const item of batch) {
      // Cek error rate secara berkala
      if (totalSent > 0 && totalSent % 20 === 0) {
        const shouldStop = await checkCampaignErrorRate(campaignId)
        if (shouldStop) return
      }

      // Ambil data kontak
      const { data: contact } = await supabase
        .from('contacts')
        .select('*')
        .eq('id', item.contact_id)
        .single()

      if (!contact) {
        await supabase.from('campaign_contacts')
          .update({ status: 'skipped', error_code: 'CONTACT_NOT_FOUND' })
          .eq('id', item.id)
        continue
      }

      // Skip jika kontak opt-out atau blocked
      if (contact.is_blocked || contact.opt_out_at) {
        await supabase.from('campaign_contacts')
          .update({ status: 'skipped', error_code: 'OPT_OUT_OR_BLOCKED' })
          .eq('id', item.id)
        continue
      }

      const result = await sendMessage(item.id, sender as SenderPhone, contact as Contact, message)
      if (result.success) totalSent++

      // Jika sender di-pause, ganti sender
      if (!result.success && result.errorCode === 'SESSION_NOT_READY') {
        break // Keluar dari loop batch, cari sender baru di iterasi berikutnya
      }
    }

    batchCount++

    // Istirahat setelah setiap batch
    await batchRest()
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add .
git commit -m "feat: add batch runner with campaign execution loop"
```

---

### Task 8: Scheduler Polling

**Files:**
- Create: `apps/worker/src/scheduler/poll.ts`

- [ ] **Step 1: Buat apps/worker/src/scheduler/poll.ts**

```typescript
import { supabase } from '../supabase'
import { runCampaign } from '../sender/batch-runner'
import { resetDailyCounters } from '../antiban/warmup'

const runningCampaigns = new Set<string>()
let lastResetDate = new Date().toDateString()

/**
 * Satu siklus polling: cek campaign terjadwal dan jalankan.
 */
export async function pollOnce(): Promise<void> {
  // Reset counter harian jika hari berganti
  const today = new Date().toDateString()
  if (today !== lastResetDate) {
    console.log('[scheduler] Hari baru, reset daily counters')
    await resetDailyCounters()
    lastResetDate = today
  }

  // Cari campaign yang perlu dijalankan
  const { data: campaigns } = await supabase
    .from('campaigns')
    .select('id, name')
    .eq('status', 'scheduled')
    .lte('scheduled_at', new Date().toISOString())

  if (!campaigns?.length) return

  for (const campaign of campaigns) {
    if (runningCampaigns.has(campaign.id)) continue

    console.log(`[scheduler] Memulai campaign: ${campaign.name} (${campaign.id})`)
    runningCampaigns.add(campaign.id)

    // Jalankan tanpa await agar tidak blocking scheduler
    runCampaign(campaign.id).finally(() => {
      runningCampaigns.delete(campaign.id)
    })
  }
}
```

- [ ] **Step 2: Update apps/worker/src/index.ts (entry point utama)**

```typescript
import { config } from './config'
import { initAllSessions } from './baileys/session-manager'
import { pollOnce } from './scheduler/poll'

async function main() {
  console.log('[Worker] WA Broadcast Worker v1.0.0 started')
  console.log(`[Worker] Poll interval: ${config.pollIntervalMs / 1000}s`)

  // Init semua sesi Baileys
  await initAllSessions()

  // Tunggu sebentar agar sesi connect
  await new Promise(r => setTimeout(r, 5_000))

  // Mulai polling loop
  console.log('[Worker] Scheduler polling dimulai')
  await pollOnce() // jalankan sekali langsung

  setInterval(async () => {
    try {
      await pollOnce()
    } catch (err) {
      console.error('[Worker] Poll error:', err)
    }
  }, config.pollIntervalMs)
}

main().catch(err => {
  console.error('[Worker] Fatal error:', err)
  process.exit(1)
})

process.on('SIGTERM', () => {
  console.log('[Worker] Shutting down gracefully...')
  process.exit(0)
})

process.on('unhandledRejection', (err) => {
  console.error('[Worker] Unhandled rejection:', err)
})
```

- [ ] **Step 3: Commit**

```bash
git add .
git commit -m "feat: add scheduler polling loop and main entry point"
```

---

### Task 9: Deploy ke Railway

**Files:**
- Create: `apps/worker/railway.json`
- Create: `apps/worker/.env.example`

- [ ] **Step 1: Buat apps/worker/railway.json**

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "pnpm start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 5
  }
}
```

- [ ] **Step 2: Buat apps/worker/.env.example**

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
AUTH_DIR=/app/auth_sessions
```

- [ ] **Step 3: Tambah nixpacks.toml di root apps/worker**

```toml
[phases.setup]
nixPkgs = ["nodejs_20"]

[phases.install]
cmds = ["npm install -g pnpm", "pnpm install --frozen-lockfile"]

[start]
cmd = "pnpm --filter worker start"
```

- [ ] **Step 4: Deploy ke Railway**

1. Buka https://railway.app → New Project → Deploy from GitHub Repo
2. Pilih repo ini
3. Set root directory: `apps/worker`
4. Tambah environment variables:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `AUTH_DIR=/app/auth_sessions`
5. Deploy

- [ ] **Step 5: Cek logs Railway**

Di Railway dashboard → Deployments → View Logs

Expected output:
```
[Worker] WA Broadcast Worker v1.0.0 started
[Worker] Poll interval: 30s
[session-manager] Tidak ada sender yang perlu diinisialisasi
[Worker] Scheduler polling dimulai
```

- [ ] **Step 6: Test end-to-end**

1. Tambah sender phone di dashboard web
2. Worker akan init sesi Baileys → QR tersimpan di Supabase
3. Buat endpoint sederhana di web untuk tampilkan QR: `/api/senders/[id]/qr`
4. Scan QR dengan HP → sender status jadi `warmup`
5. Buat campaign test dengan 1 kontak
6. Set jadwal = sekarang + 1 menit
7. Worker polling → campaign berjalan → cek delivery logs di Supabase

- [ ] **Step 7: Commit final**

```bash
git add .
git commit -m "feat: add Railway deployment config"
```

---

### Task 10: API QR Code di Web

**Files:**
- Create: `apps/web/app/api/senders/[id]/qr/route.ts`
- Modify: `apps/web/app/dashboard/senders/page.tsx`

- [ ] **Step 1: Buat apps/web/app/api/senders/[id]/qr/route.ts**

```typescript
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: sender } = await supabase
    .from('sender_phones')
    .select('session_data, status, user_id')
    .eq('id', id)
    .single()

  if (!sender || sender.user_id !== user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const sessionData = sender.session_data as Record<string, unknown> | null
  return NextResponse.json({
    qr: sessionData?.qr ?? null,
    connected: sessionData?.connected ?? false,
    status: sender.status,
  })
}
```

- [ ] **Step 2: Tambah tombol "Lihat QR" di senders page**

Tambahkan komponen client di `apps/web/app/dashboard/senders/qr-button.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

export function QRButton({ senderId }: { senderId: string }) {
  const [qr, setQr] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function fetchQR() {
    setLoading(true)
    const res = await fetch(`/api/senders/${senderId}/qr`)
    const data = await res.json()
    setQr(data.qr)
    setLoading(false)
  }

  return (
    <div>
      <Button variant="outline" size="sm" onClick={fetchQR} disabled={loading}>
        {loading ? 'Loading...' : 'Lihat QR'}
      </Button>
      {qr && (
        <div className="mt-2 p-2 bg-white border rounded">
          <p className="text-xs text-gray-500 mb-1">Scan dengan WhatsApp di HP Anda</p>
          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qr)}`}
            alt="QR Code"
            width={200}
            height={200}
          />
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Tambah QRButton di tabel senders**

Di `apps/web/app/dashboard/senders/page.tsx`, import dan tambahkan `<QRButton senderId={sender.id} />` di kolom aksi, sebelum tombol Hapus.

- [ ] **Step 4: Tambah domain QR server ke next.config.ts**

```typescript
images: {
  remotePatterns: [
    { protocol: 'https', hostname: '*.supabase.co' },
    { protocol: 'https', hostname: 'api.qrserver.com' },
  ],
},
```

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "feat: add QR code display for sender phone pairing"
```

---

## Verifikasi Plan 3 Selesai

- [ ] Railway worker berjalan tanpa error di logs
- [ ] Tambah sender → QR tampil di dashboard → scan berhasil → status jadi warmup
- [ ] Buat campaign test → set jadwal → worker kirim → delivery log terbuat di Supabase
- [ ] Soft ban test: paksa 3 kegagalan → sender otomatis di-pause, status berubah ke `soft_banned`
- [ ] Spintax test: buat template `{Halo|Hi} {nama}!` → tiap pesan berbeda

---

## Rangkuman 3 Plan

| Plan | Scope | Output |
|---|---|---|
| Plan 1 | Monorepo, DB, Auth | Login/register berfungsi, skema DB terbuat |
| Plan 2 | Dashboard UI | 5 halaman dashboard lengkap |
| Plan 3 | Railway Worker | Broadcast berjalan dengan anti-ban |
