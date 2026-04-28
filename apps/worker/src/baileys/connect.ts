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
import QRCode from 'qrcode'

const logger = pino({ level: 'warn' })

export type WASocket = ReturnType<typeof makeWASocket>

const AUTH_DIR = process.env.AUTH_DIR ?? join(process.cwd(), 'auth_sessions')

export async function createWAConnection(
  senderId: string,
  onQR: (qr: string) => void,
  onReady: () => void,
  onDisconnect: (shouldReconnect: boolean) => void | Promise<void>
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
    keepAliveIntervalMs: 30_000,
  })

  sock.ev.on('creds.update', saveCreds)

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update

    if (qr) {
      const qrDataUrl = await QRCode.toDataURL(qr, { width: 300, margin: 2 })
      onQR(qrDataUrl)
    }

    if (connection === 'open') {
      console.log(`[baileys] Sender ${senderId} terhubung`)
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
