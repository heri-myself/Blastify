import { getReadySocket } from '../baileys/session-manager'
import { waitForSlot } from '../antiban/throttle'
import { recordSuccess, recordFailure } from '../antiban/monitor'
import { renderMessage } from '../spintax/render'
import { supabase } from '../supabase'
import type { SenderPhone, Contact, CampaignMessage } from '@wa-broadcast/db'

export interface SendResult {
  success: boolean
  errorCode?: string
}

export async function sendMessage(
  campaignContactId: string,
  sender: SenderPhone,
  contact: Contact,
  message: CampaignMessage
): Promise<SendResult> {
  const sock = getReadySocket(sender.id)
  if (!sock) {
    return { success: false, errorCode: 'SESSION_NOT_READY' }
  }

  const contactData: Record<string, string> = {
    nama: contact.name ?? '',
    phone: contact.phone,
    ...(contact.extra_data as Record<string, string> ?? {}),
  }
  const renderedContent = message.content
    ? renderMessage(message.content, contactData)
    : ''

  await waitForSlot(sender.id)

  await supabase.from('campaign_contacts').update({
    status: 'sending',
    sender_phone_id: sender.id,
  }).eq('id', campaignContactId)

  try {
    const jid = `${contact.phone}@s.whatsapp.net`

    if (message.type === 'text') {
      await sock.sendMessage(jid, { text: renderedContent })
    } else if (message.type === 'image' && message.media_url) {
      await sock.sendMessage(jid, {
        image: { url: message.media_url },
        caption: renderedContent,
      })
    } else if (message.type === 'document' && message.media_url) {
      await sock.sendMessage(jid, {
        document: { url: message.media_url },
        caption: renderedContent,
        fileName: 'dokumen.pdf',
        mimetype: 'application/pdf',
      })
    } else {
      await sock.sendMessage(jid, { text: renderedContent })
    }

    await recordSuccess(sender)
    await supabase.from('campaign_contacts').update({
      status: 'sent',
      sent_at: new Date().toISOString(),
    }).eq('id', campaignContactId)
    await supabase.from('delivery_logs').insert({
      campaign_contact_id: campaignContactId,
      event: 'sent',
      details: { sender_id: sender.id },
    })

    return { success: true }
  } catch (err) {
    const errorCode = (err as Error).message ?? 'UNKNOWN_ERROR'
    const paused = await recordFailure(sender, errorCode)

    await supabase.from('campaign_contacts').update({
      status: 'failed',
      error_code: errorCode,
    }).eq('id', campaignContactId)
    await supabase.from('delivery_logs').insert({
      campaign_contact_id: campaignContactId,
      event: 'failed',
      details: { error: errorCode, sender_paused: paused },
    })

    return { success: false, errorCode }
  }
}
