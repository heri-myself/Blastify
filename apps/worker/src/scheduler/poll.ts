import { supabase } from '../supabase'
import { runCampaign } from '../sender/batch-runner'
import { resetDailyCounters } from '../antiban/warmup'
import { sendHeartbeat } from '../heartbeat'

const runningCampaigns = new Set<string>()
let lastResetDate = new Date().toDateString()

export async function pollOnce(): Promise<void> {
  const today = new Date().toDateString()
  if (today !== lastResetDate) {
    console.log('[scheduler] Hari baru, reset daily counters')
    await resetDailyCounters()
    lastResetDate = today
  }

  const { data: allScheduled, error: queryError } = await supabase
    .from('campaigns')
    .select('id, name, scheduled_at')
    .eq('status', 'scheduled')

  if (queryError) {
    console.error('[scheduler] Gagal query campaigns:', queryError.message)
    return
  }

  console.log(`[scheduler] Ditemukan ${allScheduled?.length ?? 0} campaign scheduled, running: ${runningCampaigns.size}`)

  const now = Date.now()
  const campaigns = (allScheduled ?? []).filter(c => {
    if (!c.scheduled_at) return true
    const scheduledMs = new Date(c.scheduled_at).getTime()
    if (scheduledMs > now) {
      console.log(`[scheduler] Campaign "${c.name}" belum waktunya (scheduled: ${c.scheduled_at}, now: ${new Date(now).toISOString()})`)
      return false
    }
    return true
  })

  const queued = campaigns.filter(c => !runningCampaigns.has(c.id)).length

  await sendHeartbeat(runningCampaigns.size, queued).catch(() => {})

  if (!campaigns.length) return

  for (const campaign of campaigns) {
    if (runningCampaigns.has(campaign.id)) continue

    console.log(`[scheduler] Memulai campaign: ${campaign.name} (${campaign.id})`)
    runningCampaigns.add(campaign.id)

    runCampaign(campaign.id).finally(() => {
      runningCampaigns.delete(campaign.id)
    })
  }
}
