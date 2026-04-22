console.log('[Worker] Started — WA Broadcast Worker v1.0.0')
console.log('[Worker] Waiting for Baileys setup in Plan 3...')

process.on('SIGTERM', () => {
  console.log('[Worker] Shutting down gracefully...')
  process.exit(0)
})
