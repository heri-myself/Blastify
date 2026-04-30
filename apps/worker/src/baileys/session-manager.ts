import { createWAConnection, type WASocket } from './connect'
import { supabase } from '../supabase'
import { existsSync } from 'fs'
import { join } from 'path'
import { rmSync } from 'fs'

const AUTH_DIR = process.env.AUTH_DIR ?? join(process.cwd(), 'auth_sessions')

function hasAuthFile(senderId: string): boolean {
  return existsSync(join(AUTH_DIR, senderId, 'creds.json'))
}

function deleteAuthFiles(senderId: string): void {
  const path = join(AUTH_DIR, senderId)
  try { rmSync(path, { recursive: true, force: true }) } catch {}
}

// Exponential backoff: 5s, 10s, 20s, 40s, 80s, 160s, cap at 300s
function reconnectDelay(attempts: number): number {
  return Math.min(5_000 * Math.pow(2, attempts - 1), 300_000)
}

interface Session {
  sock: WASocket
  senderId: string
  ready: boolean
  reconnecting: boolean
  reconnectAttempts: number
  lastQr?: string  // simpan QR terakhir agar tidak hilang saat disconnect
}

const sessions = new Map<string, Session>()
const reconnectTimers = new Map<string, NodeJS.Timeout>()

export async function initAllSessions(): Promise<void> {
  // Reset sender yang ter-disable karena bug, agar bisa diinit ulang
  await supabase
    .from('sender_phones')
    .update({ status: 'warmup', session_data: { connected: false } })
    .eq('status', 'disabled')

  const { data: senders } = await supabase
    .from('sender_phones')
    .select('id, phone_number, status')

  if (!senders?.length) {
    console.log('[session-manager] Tidak ada sender yang perlu diinisialisasi')
    return
  }

  for (const sender of senders) {
    await initSession(sender.id)
  }
}

export async function initSession(senderId: string): Promise<void> {
  const existing = sessions.get(senderId)
  if (existing && !existing.reconnecting) return

  const reconnectAttempts = existing?.reconnectAttempts ?? 0
  console.log(`[session-manager] Init sesi untuk sender ${senderId} (attempt ${reconnectAttempts + 1})`)

  const sock = await createWAConnection(
    senderId,
    async (qrDataUrl) => {
      console.log(`[session-manager] QR untuk ${senderId}: (base64 image)`)
      // Simpan QR di memory session
      const session = sessions.get(senderId)
      if (session) session.lastQr = qrDataUrl

      await supabase
        .from('sender_phones')
        .update({ session_data: { qr: qrDataUrl, qr_at: new Date().toISOString(), connected: false } })
        .eq('id', senderId)
    },
    async () => {
      const session = sessions.get(senderId)
      if (session) {
        session.ready = true
        session.reconnecting = false
        session.reconnectAttempts = 0
        session.lastQr = undefined
      }
      const { error: readyErr } = await supabase
        .from('sender_phones')
        .update({ session_data: { qr: null, connected: true }, status: 'active' })
        .eq('id', senderId)
      if (readyErr) console.error(`[session-manager] Gagal update connected=true untuk ${senderId}:`, readyErr.message)
      else console.log(`[session-manager] Sender ${senderId} terhubung dan aktif`)
    },
    async (shouldReconnect) => {
      const session = sessions.get(senderId)
      const attempts = (session?.reconnectAttempts ?? 0) + 1
      const lastQr = session?.lastQr ?? null

      if (!shouldReconnect) {
        // Reason 401: WhatsApp aktif logout session ini
        console.log(`[session-manager] Sender ${senderId} di-logout WhatsApp, hapus auth dan minta scan ulang`)
        sessions.delete(senderId)
        deleteAuthFiles(senderId)
        await supabase
          .from('sender_phones')
          .update({ status: 'warmup', session_data: { connected: false, qr: null } })
          .eq('id', senderId)
        // Reconnect untuk generate QR baru
        const timer = setTimeout(() => initSession(senderId), 5_000)
        reconnectTimers.set(senderId, timer)
        return
      }

      // shouldReconnect = true: koneksi putus (408, network, dll)
      // PENTING: sertakan lastQr agar QR tidak hilang dari DB saat disconnect
      if (session) {
        session.ready = false
        session.reconnecting = true
        session.reconnectAttempts = attempts
      } else {
        sessions.set(senderId, { sock, senderId, ready: false, reconnecting: true, reconnectAttempts: attempts, lastQr: lastQr ?? undefined })
      }

      // Update connected: false tapi PERTAHANKAN qr terakhir di DB
      await supabase
        .from('sender_phones')
        .update({ session_data: { connected: false, qr: lastQr } })
        .eq('id', senderId)

      const delay = reconnectDelay(attempts)
      console.log(`[session-manager] Reconnect sender ${senderId} dalam ${Math.round(delay / 1000)}s (attempt ${attempts})`)
      const timer = setTimeout(() => initSession(senderId), delay)
      reconnectTimers.set(senderId, timer)
    }
  )

  const currentAttempts = sessions.get(senderId)?.reconnectAttempts ?? 0
  const currentLastQr = sessions.get(senderId)?.lastQr
  sessions.set(senderId, { sock, senderId, ready: false, reconnecting: false, reconnectAttempts: currentAttempts, lastQr: currentLastQr })
}

export function getReadySocket(senderId: string): WASocket | null {
  const session = sessions.get(senderId)
  if (!session?.ready) return null
  return session.sock
}

export function isSessionReady(senderId: string): boolean {
  return sessions.get(senderId)?.ready ?? false
}

export async function syncNewSenders(): Promise<void> {
  const { data: senders } = await supabase
    .from('sender_phones')
    .select('id')
    .neq('status', 'disabled')

  if (!senders?.length) return

  for (const sender of senders) {
    const session = sessions.get(sender.id)
    if (!session) {
      console.log(`[session-manager] Sender baru ditemukan: ${sender.id}, init sesi...`)
      await initSession(sender.id)
    }
  }
}
