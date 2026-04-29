'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getUserRole } from '@/lib/get-user-role'

export async function addSenderForUser(formData: FormData) {
  const profile = await getUserRole()
  if (!profile || profile.role !== 'superadmin') return { error: 'Unauthorized' }

  const targetUserId = formData.get('target_user_id') as string
  if (!targetUserId) return { error: 'Pilih user terlebih dahulu' }

  const admin = createAdminClient()
  const { error } = await admin.from('sender_phones').insert({
    user_id: targetUserId,
    phone_number: (formData.get('phone_number') as string).trim(),
    display_name: (formData.get('display_name') as string)?.trim() || null,
    status: 'warmup',
  })

  if (error) return { error: error.message }
  revalidatePath('/dashboard/senders')
  return { success: true }
}

export async function addSender(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase.from('sender_phones').insert({
    user_id: user.id,
    phone_number: (formData.get('phone_number') as string).trim(),
    display_name: (formData.get('display_name') as string).trim() || null,
    status: 'warmup',
  })

  if (error) return { error: error.message }
  revalidatePath('/dashboard/senders')
  return { success: true }
}

export async function deleteSender(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  // Pastikan sender milik user ini
  const { data: sender } = await supabase.from('sender_phones').select('id').eq('id', id).eq('user_id', user.id).single()
  if (!sender) return { error: 'Sender tidak ditemukan' }

  const admin = createAdminClient()

  // Ambil campaign_contact ids yang pakai sender ini
  const { data: ccIds } = await admin.from('campaign_contacts').select('id').eq('sender_phone_id', id)
  if (ccIds?.length) {
    await admin.from('delivery_logs').delete().in('campaign_contact_id', ccIds.map(c => c.id))
  }
  // Null-kan referensi sender di campaign_contacts
  await admin.from('campaign_contacts').update({ sender_phone_id: null }).eq('sender_phone_id', id)

  const { error } = await admin.from('sender_phones').delete().eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/dashboard/senders')
  return { success: true }
}
