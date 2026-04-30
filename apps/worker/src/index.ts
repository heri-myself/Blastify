import { config } from './config'
import { initAllSessions, syncNewSenders } from './baileys/session-manager'
import { pollOnce } from './scheduler/poll'
import { supabase } from './supabase'

async function resetStuckCampaigns() {
  const { data, error } = await supabase
    .from('campaigns')
    .update({ status: 'scheduled' })
    .eq('status', 'running')
    .select('id, name')
  if (data?.length) {
    console.log(`[Worker] Reset ${data.length} campaign stuck 'running' → 'scheduled':`, data.map(c => c.name))
  }
  if (error) console.error('[Worker] Gagal reset stuck campaigns:', error.message)

  // Reset contacts stuck in 'sending' back to 'pending' (worker crashed mid-send)
  const { count } = await supabase
    .from('campaign_contacts')
    .update({ status: 'pending', sender_phone_id: null })
    .eq('status', 'sending')
    .select('id', { count: 'exact', head: true })
  if (count) console.log(`[Worker] Reset ${count} kontak stuck 'sending' → 'pending'`)
}

async function main() {
  console.log('[Worker] WA Broadcast Worker v1.0.0 started')
  console.log(`[Worker] Poll interval: ${config.pollIntervalMs / 1000}s`)

  await resetStuckCampaigns()
  await initAllSessions()
  await new Promise(r => setTimeout(r, 5_000))

  console.log('[Worker] Scheduler polling dimulai')
  await pollOnce()

  setInterval(async () => {
    try {
      await syncNewSenders()
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
