'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function createCampaign(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const scheduledAt = formData.get('scheduled_at') as string
  const senderIds = formData.getAll('sender_ids') as string[]
  const messageType = formData.get('message_type') as string
  const content = formData.get('content') as string
  const mediaUrl = formData.get('media_url') as string || null
  const filterTags = formData.get('filter_tags') as string

  const { data: campaign, error: campaignError } = await supabase
    .from('campaigns')
    .insert({
      user_id: user.id,
      name: formData.get('name') as string,
      status: scheduledAt ? 'scheduled' : 'draft',
      scheduled_at: scheduledAt || null,
      sender_rotation: senderIds.length > 0 ? senderIds : null,
      target_filter: filterTags
        ? { tags: filterTags.split(',').map(t => t.trim()).filter(Boolean) }
        : null,
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

  let query = supabase
    .from('contacts')
    .select('id')
    .eq('user_id', user.id)
    .eq('is_blocked', false)
    .is('opt_out_at', null)

  if (filterTags) {
    const tags = filterTags.split(',').map(t => t.trim()).filter(Boolean)
    if (tags.length > 0) query = query.overlaps('tags', tags)
  }

  const { data: contacts } = await query

  if (contacts && contacts.length > 0) {
    const contactRows = contacts.map(c => ({
      campaign_id: campaign.id,
      contact_id: c.id,
      status: 'pending' as const,
    }))
    await supabase.from('campaign_contacts').insert(contactRows)
  }

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
