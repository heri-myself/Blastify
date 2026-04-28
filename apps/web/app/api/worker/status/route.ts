import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export const revalidate = 0

export async function GET() {
  const admin = createAdminClient()

  const [
    { data: heartbeat },
    { data: senders },
    { count: pendingCount },
    { count: runningCount },
  ] = await Promise.all([
    admin.from('worker_heartbeats').select('*').eq('id', 'default').single(),
    admin.from('sender_phones').select('id, phone_number, status, session_data').neq('status', 'disabled'),
    admin.from('campaigns').select('*', { count: 'exact', head: true }).eq('status', 'scheduled'),
    admin.from('campaigns').select('*', { count: 'exact', head: true }).eq('status', 'running'),
  ])

  const now = Date.now()
  const lastSeen = heartbeat?.last_seen ? new Date(heartbeat.last_seen).getTime() : 0
  const secondsAgo = Math.floor((now - lastSeen) / 1000)
  const isOnline = secondsAgo < 60

  return NextResponse.json({
    worker: {
      online: isOnline,
      lastSeen: heartbeat?.last_seen ?? null,
      secondsAgo,
      version: heartbeat?.version ?? null,
      campaignsRunning: heartbeat?.campaigns_running ?? 0,
      campaignsQueued: heartbeat?.campaigns_queued ?? 0,
      messagesSentToday: heartbeat?.messages_sent_today ?? 0,
    },
    campaigns: {
      scheduled: pendingCount ?? 0,
      running: runningCount ?? 0,
    },
    senders: (senders ?? []).map(s => ({
      id: s.id,
      phone: s.phone_number,
      status: s.status,
      connected: (s.session_data as any)?.connected ?? false,
    })),
  })
}
