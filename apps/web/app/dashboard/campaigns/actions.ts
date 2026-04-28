'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function createCampaign(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const scheduledAtRaw = formData.get('scheduled_at') as string
  // datetime-local input has no timezone — treat as WIB (UTC+7)
  const scheduledAt = scheduledAtRaw
    ? new Date(scheduledAtRaw + ':00+07:00').toISOString()
    : ''
  const senderIds = formData.getAll('sender_ids') as string[]
  const messageType = formData.get('message_type') as string
  const content = formData.get('content') as string
  const mediaUrl = formData.get('media_url') as string || null

  const { data: campaign, error: campaignError } = await supabase
    .from('campaigns')
    .insert({
      user_id: user.id,
      name: formData.get('name') as string,
      status: scheduledAt ? 'scheduled' : 'draft',
      scheduled_at: scheduledAt || null,
      sender_rotation: senderIds.length > 0 ? senderIds : null,
      target_filter: null,
    })
    .select()
    .single()

  if (campaignError) return { error: campaignError.message }

  const { error: msgError } = await supabase.from('campaign_messages').insert({
    campaign_id: campaign.id,
    order_index: 0,
    type: messageType,
    content,
    media_url: mediaUrl,
  })
  if (msgError) return { error: msgError.message }

  revalidatePath('/dashboard/campaigns')
  redirect(`/dashboard/campaigns/${campaign.id}`)
}

export async function pauseCampaign(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  await supabase.from('campaigns').update({ status: 'paused' }).eq('id', id).eq('user_id', user.id)
  revalidatePath(`/dashboard/campaigns/${id}`)
}

export async function resumeCampaign(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  await supabase.from('campaigns').update({ status: 'scheduled' }).eq('id', id).eq('user_id', user.id)
  revalidatePath(`/dashboard/campaigns/${id}`)
}

export async function scheduleCampaign(id: string, scheduledAtLocal: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  const scheduledAt = new Date(scheduledAtLocal + ':00+07:00').toISOString()
  await supabase.from('campaigns').update({
    status: 'scheduled',
    scheduled_at: scheduledAt,
  }).eq('id', id).eq('user_id', user.id).in('status', ['draft', 'scheduled'])
  revalidatePath(`/dashboard/campaigns/${id}`)
}

export async function sendNowCampaign(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  await supabase.from('campaigns').update({
    status: 'scheduled',
    scheduled_at: new Date().toISOString(),
  }).eq('id', id).eq('user_id', user.id).in('status', ['draft', 'scheduled'])
  revalidatePath(`/dashboard/campaigns/${id}`)
}

export async function updateCampaignMessage(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const messageId = formData.get('message_id') as string
  const content = formData.get('content') as string
  const campaignId = formData.get('campaign_id') as string

  const { error } = await supabase
    .from('campaign_messages')
    .update({ content })
    .eq('id', messageId)

  if (error) return { error: error.message }
  revalidatePath(`/dashboard/campaigns/${campaignId}`)
  return { success: true }
}

export async function deleteCampaign(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  await supabase.from('campaigns').delete().eq('id', id).eq('user_id', user.id)
  revalidatePath('/dashboard/campaigns')
  redirect('/dashboard/campaigns')
}
