export const config = {
  supabaseUrl: process.env.SUPABASE_URL!,
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,

  // Anti-ban settings
  minDelayMs: 3_000,
  maxDelayMs: 8_000,
  batchSize: 50,
  batchRestMinMs: 120_000,
  batchRestMaxMs: 300_000,
  maxMsgPerMinute: 20,
  pauseOnFailures: 3,
  pauseDurationMs: 1_800_000,
  errorRateThreshold: 0.10,

  // Scheduler
  pollIntervalMs: 30_000,

  // Warm-up limits per hari (index = hari ke-0)
  warmupLimits: [20, 20, 20, 50, 50, 50, 50, 150, 150, 150, 150, 150, 150, 150, 500],

  // Jam aman kirim (WIB = UTC+7)
  safeSendStartHour: parseInt(process.env.SAFE_SEND_START_HOUR ?? '8'),
  safeSendEndHour: parseInt(process.env.SAFE_SEND_END_HOUR ?? '22'),
}

const required = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY']
for (const key of required) {
  if (!process.env[key]) throw new Error(`Missing required env var: ${key}`)
}
