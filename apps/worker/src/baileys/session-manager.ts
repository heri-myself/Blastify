import { createWAConnection, type WASocket } from './connect'
import { supabase } from '../supabase'

const MAX_RECONNECT_ATTEMPTS = 5

interface Session {
  sock: WASocket
  senderId: string
  ready: boolean
  reconnecting: boolean
  reconnectAttempts: number
}

const sessions = new Map<string, Session>()
const reconnectTimers = new Map<string, NodeJS.Timeout>()

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
  const existing = sessions.get(senderId)
  // Skip if session exists and is not in reconnecting state
  if (existing && !existing.reconnecting) return

  const reconnectAttempts = existing?.reconnectAttempts ?? 0
  console.log(`[session-manager] Init sesi untuk sender ${senderId} (attempt ${reconnectAttempts + 1})`)

  const sock = await createWAConnection(
    senderId,
    async (qr) => {
      console.log(`[session-manager] QR untuk ${senderId}: ${qr.substring(0, 30)}...`)
      await supabase
        .from('sender_phones')
        .update({ session_data: { qr, connected: false } })
        .eq('id', senderId)
    },
    async () => {
      const session = sessions.get(senderId)
      if (session) {
        session.ready = true
        session.reconnecting = false
        session.reconnectAttempts = 0
      }
      await supabase
        .from('sender_phones')
        .update({ session_data: { qr: null, connected: true }, status: 'active' })
        .eq('id', senderId)
    },
    async (shouldReconnect) => {
      const session = sessions.get(senderId)
      const attempts = (session?.reconnectAttempts ?? 0) + 1

      if (!shouldReconnect || attempts > MAX_RECONNECT_ATTEMPTS) {
        console.log(`[session-manager] Sender ${senderId} disconnect permanen (attempts: ${attempts})`)
        sessions.delete(senderId)
        await supabase
          .from('sender_phones')
          .update({ status: 'disabled', session_data: { connected: false } })
          .eq('id', senderId)
        return
      }

      // Mark as reconnecting so syncNewSenders doesn't re-init
      if (session) {
        session.ready = false
        session.reconnecting = true
        session.reconnectAttempts = attempts
      } else {
        // Session was somehow removed, re-add placeholder
        sessions.set(senderId, { sock, senderId, ready: false, reconnecting: true, reconnectAttempts: attempts })
      }

      const delay = 5_000 + Math.random() * 10_000
      console.log(`[session-manager] Reconnect sender ${senderId} dalam ${Math.round(delay / 1000)}s (attempt ${attempts}/${MAX_RECONNECT_ATTEMPTS})`)
      const timer = setTimeout(() => initSession(senderId), delay)
      reconnectTimers.set(senderId, timer)
    }
  )

  const currentAttempts = sessions.get(senderId)?.reconnectAttempts ?? 0
  sessions.set(senderId, { sock, senderId, ready: false, reconnecting: false, reconnectAttempts: currentAttempts })
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
    // Only init if truly new (not in map at all, not reconnecting)
    if (!session) {
      console.log(`[session-manager] Sender baru ditemukan: ${sender.id}, init sesi...`)
      await initSession(sender.id)
    }
  }
}
