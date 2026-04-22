import { config } from '../config'
import { supabase } from '../supabase'
import type { SenderPhone } from '@wa-broadcast/db'

export async function checkSendAllowed(sender: SenderPhone): Promise<string | null> {
  const nowWIB = new Date(Date.now() + 7 * 60 * 60 * 1000)
  const hour = nowWIB.getUTCHours()
  if (hour < config.safeSendStartHour || hour >= config.safeSendEndHour) {
    return `Di luar jam aman (${config.safeSendStartHour}:00–${config.safeSendEndHour}:00 WIB)`
  }

  if (sender.status === 'disabled') return 'Sender disabled'
  if (sender.status === 'soft_banned') {
    if (sender.recover_at && new Date(sender.recover_at) > new Date()) {
      return `Soft banned sampai ${sender.recover_at}`
    }
    await supabase.from('sender_phones').update({
      status: 'recovering',
      consecutive_failures: 0,
    }).eq('id', sender.id)
    return null
  }

  const limit = getWarmupLimit(sender.warmup_day)
  if (sender.daily_sent >= limit) {
    return `Sudah mencapai limit harian (${sender.daily_sent}/${limit})`
  }

  return null
}

export function getWarmupLimit(warmupDay: number): number {
  const idx = Math.min(warmupDay, config.warmupLimits.length - 1)
  return config.warmupLimits[idx]
}

export async function resetDailyCounters(): Promise<void> {
  // Reset daily sent count for all non-disabled senders
  await supabase.from('sender_phones')
    .update({ daily_sent: 0 })
    .neq('status', 'disabled')

  // Fetch warmup senders to increment their day counter
  const { data: warmupSenders } = await supabase
    .from('sender_phones')
    .select('id, warmup_day')
    .eq('status', 'warmup')
    .lt('warmup_day', 14)

  if (warmupSenders?.length) {
    for (const sender of warmupSenders) {
      const newDay = sender.warmup_day + 1
      const newStatus = newDay >= 14 ? 'active' : 'warmup'
      await supabase.from('sender_phones').update({
        warmup_day: newDay,
        status: newStatus,
      }).eq('id', sender.id)
    }
  }
}
