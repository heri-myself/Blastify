import { createWAConnection, type WASocket } from './connect'
import { supabase } from '../supabase'

interface Session {
  sock: WASocket
  senderId: string
  ready: boolean
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
  if (sessions.has(senderId)) return

  console.log(`[session-manager] Init sesi untuk sender ${senderId}`)

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
      if (session) session.ready = true
      await supabase
        .from('sender_phones')
        .update({ session_data: { qr: null, connected: true }, status: 'active' })
        .eq('id', senderId)
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
    if (!sessions.has(sender.id)) {
      console.log(`[session-manager] Sender baru ditemukan: ${sender.id}, init sesi...`)
      await initSession(sender.id)
    }
  }
}
