import { supabase } from '../supabase'
import { runCampaign } from '../sender/batch-runner'
import { resetDailyCounters } from '../antiban/warmup'

const runningCampaigns = new Set<string>()
let lastResetDate = new Date().toDateString()

export async function pollOnce(): Promise<void> {
  const today = new Date().toDateString()
  if (today !== lastResetDate) {
    console.log('[scheduler] Hari baru, reset daily counters')
    await resetDailyCounters()
    lastResetDate = today
  }

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

    runCampaign(campaign.id).finally(() => {
      runningCampaigns.delete(campaign.id)
    })
  }
}
