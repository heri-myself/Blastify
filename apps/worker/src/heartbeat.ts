import { supabase } from './supabase'

const VERSION = '1.0.0'

export async function sendHeartbeat(campaignsRunning: number, campaignsQueued: number): Promise<void> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const { data: sentToday } = await supabase
    .from('campaign_contacts')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'sent')
    .gte('sent_at', today.toISOString())

  await supabase.from('worker_heartbeats').upsert({
    id: 'default',
    last_seen: new Date().toISOString(),
    version: VERSION,
    campaigns_running: campaignsRunning,
    campaigns_queued: campaignsQueued,
    messages_sent_today: (sentToday as any)?.count ?? 0,
    updated_at: new Date().toISOString(),
  })
}
