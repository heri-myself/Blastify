import { config } from './config'
import { initAllSessions, syncNewSenders } from './baileys/session-manager'
import { pollOnce } from './scheduler/poll'

async function main() {
  console.log('[Worker] WA Broadcast Worker v1.0.0 started')
  console.log(`[Worker] Poll interval: ${config.pollIntervalMs / 1000}s`)

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
