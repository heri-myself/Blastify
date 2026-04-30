import { supabase } from '../supabase'
import { sendMessage } from './send-message'
import { pickBestSender, checkCampaignErrorRate } from '../antiban/monitor'
import { batchRest } from '../antiban/throttle'
import { config } from '../config'
import type { SenderPhone, Contact, CampaignMessage } from '@wa-broadcast/db'

export async function runCampaign(campaignId: string): Promise<void> {
  console.log(`[batch] Mulai campaign ${campaignId}`)

  await supabase.from('campaigns').update({
    status: 'running',
    started_at: new Date().toISOString(),
  }).eq('id', campaignId)

  const { data: messages } = await supabase
    .from('campaign_messages')
    .select('*')
    .eq('campaign_id', campaignId)
    .order('order_index')

  if (!messages?.length) {
    console.log(`[batch] Campaign ${campaignId} tidak punya pesan`)
    await supabase.from('campaigns').update({ status: 'failed' }).eq('id', campaignId)
    return
  }

  const message = messages[0] as CampaignMessage

  const { data: campaign } = await supabase
    .from('campaigns')
    .select('sender_rotation, user_id')
    .eq('id', campaignId)
    .single()

  const rotationIds: string[] = (campaign?.sender_rotation as string[] | null) ?? []
  let totalSent = 0

  async function resolveSenderIds(): Promise<string[]> {
    if (rotationIds.length > 0) return rotationIds
    if (!campaign?.user_id) return []
    const { data: allSenders } = await supabase
      .from('sender_phones')
      .select('id')
      .eq('user_id', campaign.user_id)
      .in('status', ['active', 'warmup', 'recovering'])
    const ids = allSenders?.map(s => s.id) ?? []
    console.log(`[batch] sender_rotation kosong, menggunakan ${ids.length} sender aktif milik user`)
    return ids
  }

  while (true) {
    const { data: currentCampaign } = await supabase
      .from('campaigns')
      .select('status')
      .eq('id', campaignId)
      .single()

    if (currentCampaign?.status !== 'running') {
      console.log(`[batch] Campaign ${campaignId} dihentikan (status: ${currentCampaign?.status})`)
      return
    }

    const { data: batch } = await supabase
      .from('campaign_contacts')
      .select('id, contact_id, retry_count')
      .eq('campaign_id', campaignId)
      .eq('status', 'pending')
      .limit(config.batchSize)

    if (!batch?.length) {
      console.log(`[batch] Campaign ${campaignId} selesai (${totalSent} terkirim)`)
      await supabase.from('campaigns').update({
        status: 'done',
        finished_at: new Date().toISOString(),
      }).eq('id', campaignId)
      return
    }

    // Re-resolve sender IDs every loop to pick up newly connected senders
    const senderIds = await resolveSenderIds()
    const sender = await pickBestSender(senderIds)
    if (!sender) {
      console.log(`[batch] Tidak ada sender tersedia untuk campaign ${campaignId}, tunggu 2 menit`)
      await new Promise(r => setTimeout(r, 2 * 60 * 1000))
      continue
    }

    let sessionNotReady = false
    for (const item of batch) {
      if (totalSent > 0 && totalSent % 20 === 0) {
        const shouldStop = await checkCampaignErrorRate(campaignId)
        if (shouldStop) return
      }

      const { data: contact } = await supabase
        .from('contacts')
        .select('*')
        .eq('id', item.contact_id)
        .single()

      if (!contact) {
        await supabase.from('campaign_contacts')
          .update({ status: 'skipped', error_code: 'CONTACT_NOT_FOUND' })
          .eq('id', item.id)
        continue
      }

      if (contact.is_blocked || contact.opt_out_at) {
        await supabase.from('campaign_contacts')
          .update({ status: 'skipped', error_code: 'OPT_OUT_OR_BLOCKED' })
          .eq('id', item.id)
        continue
      }

      const result = await sendMessage(item.id, sender as SenderPhone, contact as Contact, message)
      if (result.success) totalSent++

      if (!result.success && result.errorCode === 'SESSION_NOT_READY') {
        console.log(`[batch] Sender ${sender.id} SESSION_NOT_READY, tunggu 15s lalu retry`)
        await new Promise(r => setTimeout(r, 15_000))
        sessionNotReady = true
        break
      }
    }

    if (!sessionNotReady) await batchRest()
  }
}
