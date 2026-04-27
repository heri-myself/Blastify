'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { getUserRole } from '@/lib/get-user-role'

async function verifyCampaignOwnership(campaignId: string, userId: string) {
  const admin = createAdminClient()
  const { data } = await admin
    .from('campaigns')
    .select('id')
    .eq('id', campaignId)
    .eq('user_id', userId)
    .single()
  return !!data
}

export async function addContactsToCampaign(campaignId: string, contactIds: string[]) {
  const profile = await getUserRole()
  if (!profile) return { error: 'Unauthorized' }

  const owned = await verifyCampaignOwnership(campaignId, profile.userId)
  if (!owned) return { error: 'Campaign tidak ditemukan' }

  const admin = createAdminClient()

  const { data: existing } = await admin
    .from('campaign_contacts')
    .select('contact_id')
    .eq('campaign_id', campaignId)

  const existingIds = new Set((existing ?? []).map(r => r.contact_id))
  const newIds = contactIds.filter(id => !existingIds.has(id))

  if (newIds.length === 0) return { error: 'Semua kontak sudah ada di campaign ini', count: 0 }

  const rows = newIds.map(contact_id => ({
    campaign_id: campaignId,
    contact_id,
    status: 'pending' as const,
  }))

  const { error } = await admin.from('campaign_contacts').insert(rows)
  if (error) return { error: error.message }

  revalidatePath(`/dashboard/campaigns/${campaignId}`)
  return { success: true, count: newIds.length }
}

export async function removeContactFromCampaign(campaignContactId: string, campaignId: string) {
  const profile = await getUserRole()
  if (!profile) return { error: 'Unauthorized' }

  const owned = await verifyCampaignOwnership(campaignId, profile.userId)
  if (!owned) return { error: 'Campaign tidak ditemukan' }

  const admin = createAdminClient()
  const { error } = await admin
    .from('campaign_contacts')
    .delete()
    .eq('id', campaignContactId)
    .eq('status', 'pending')

  if (error) return { error: error.message }
  revalidatePath(`/dashboard/campaigns/${campaignId}`)
  return { success: true }
}

export async function retryContactBroadcast(campaignContactId: string, campaignId: string) {
  const profile = await getUserRole()
  if (!profile) return { error: 'Unauthorized' }

  const owned = await verifyCampaignOwnership(campaignId, profile.userId)
  if (!owned) return { error: 'Campaign tidak ditemukan' }

  const admin = createAdminClient()
  const { error } = await admin
    .from('campaign_contacts')
    .update({ status: 'pending', error_code: null, retry_count: 0 })
    .eq('id', campaignContactId)
    .eq('status', 'failed')

  if (error) return { error: error.message }
  revalidatePath(`/dashboard/campaigns/${campaignId}`)
  return { success: true }
}

export async function removePendingContacts(campaignId: string) {
  const profile = await getUserRole()
  if (!profile) return { error: 'Unauthorized' }

  const owned = await verifyCampaignOwnership(campaignId, profile.userId)
  if (!owned) return { error: 'Campaign tidak ditemukan' }

  const admin = createAdminClient()
  const { error } = await admin
    .from('campaign_contacts')
    .delete()
    .eq('campaign_id', campaignId)
    .eq('status', 'pending')

  if (error) return { error: error.message }
  revalidatePath(`/dashboard/campaigns/${campaignId}`)
  return { success: true }
}
