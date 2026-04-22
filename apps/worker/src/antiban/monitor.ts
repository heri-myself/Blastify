import { config } from '../config'
import { supabase } from '../supabase'
import type { SenderPhone } from '@wa-broadcast/db'

export async function recordSuccess(sender: SenderPhone): Promise<void> {
  await supabase.from('sender_phones').update({
    consecutive_failures: 0,
    daily_sent: sender.daily_sent + 1,
    last_sent_at: new Date().toISOString(),
  }).eq('id', sender.id)
}

export async function recordFailure(
  sender: SenderPhone,
  errorCode: string
): Promise<boolean> {
  const newFailures = sender.consecutive_failures + 1

  if (newFailures >= config.pauseOnFailures) {
    const recoverAt = new Date(Date.now() + config.pauseDurationMs).toISOString()
    await supabase.from('sender_phones').update({
      status: 'soft_banned',
      consecutive_failures: newFailures,
      banned_at: new Date().toISOString(),
      recover_at: recoverAt,
    }).eq('id', sender.id)
    console.log(`[monitor] Sender ${sender.phone_number} di-pause sampai ${recoverAt} (${newFailures} kegagalan)`)
    return true
  }

  await supabase.from('sender_phones').update({
    consecutive_failures: newFailures,
  }).eq('id', sender.id)
  return false
}

export async function checkCampaignErrorRate(campaignId: string): Promise<boolean> {
  const { data } = await supabase
    .from('campaign_contacts')
    .select('status')
    .eq('campaign_id', campaignId)
    .in('status', ['sent', 'delivered', 'failed'])

  if (!data || data.length < 10) return false

  const failed = data.filter(d => d.status === 'failed').length
  const rate = failed / data.length

  if (rate > config.errorRateThreshold) {
    await supabase.from('campaigns').update({
      status: 'paused',
    }).eq('id', campaignId)
    console.log(`[monitor] Campaign ${campaignId} di-pause: error rate ${Math.round(rate * 100)}%`)
    return true
  }

  return false
}

export async function pickBestSender(
  senderIds: string[]
): Promise<SenderPhone | null> {
  const { data: senders } = await supabase
    .from('sender_phones')
    .select('*')
    .in('id', senderIds)
    .in('status', ['active', 'recovering', 'warmup'])
    .order('daily_sent', { ascending: true })

  if (!senders?.length) return null

  const { checkSendAllowed } = await import('./warmup')
  for (const sender of senders) {
    const reason = await checkSendAllowed(sender as SenderPhone)
    if (!reason) return sender as SenderPhone
  }

  return null
}
