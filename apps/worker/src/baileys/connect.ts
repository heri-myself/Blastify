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
      await supabase.from('sender_phones').update({
        session_data: { qr, qr_at: new Date().toISOString() }
      }).eq('id', senderId)
    }

    if (connection === 'open') {
      console.log(`[baileys] Sender ${senderId} terhubung`)
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
