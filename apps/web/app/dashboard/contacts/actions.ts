'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { getUserRole } from '@/lib/get-user-role'

export async function importContacts(contacts: Array<{ phone: string; name?: string; tags?: string }>) {
  const profile = await getUserRole()
  if (!profile) return { error: 'Unauthorized' }

  const admin = createAdminClient()
  const rows = contacts
    .filter(c => c.phone?.trim())
    .map(c => ({
      user_id: profile.userId,
      phone: c.phone.trim().replace(/\D/g, ''),
      name: c.name?.trim() || null,
      tags: c.tags ? c.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
    }))

  const { error } = await admin
    .from('contacts')
    .upsert(rows, { onConflict: 'user_id,phone', ignoreDuplicates: false })

  if (error) return { error: error.message }
  revalidatePath('/dashboard/contacts')
  return { success: true, count: rows.length }
}

export async function deleteContact(id: string) {
  const profile = await getUserRole()
  if (!profile) return { error: 'Unauthorized' }

  const admin = createAdminClient()
  const query = admin.from('contacts').delete().eq('id', id)
  const { error } = profile.role === 'superadmin'
    ? await query
    : await query.eq('user_id', profile.userId)

  if (error) return { error: error.message }
  revalidatePath('/dashboard/contacts')
  return { success: true }
}

export async function addContact(data: { phone: string; name?: string; tags?: string }) {
  const profile = await getUserRole()
  if (!profile) return { error: 'Unauthorized' }

  const phone = data.phone.trim().replace(/\D/g, '')
  if (!phone) return { error: 'Nomor HP tidak boleh kosong' }

  const admin = createAdminClient()
  const { error } = await admin
    .from('contacts')
    .upsert(
      [{
        user_id: profile.userId,
        phone,
        name: data.name?.trim() || null,
        tags: data.tags ? data.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      }],
      { onConflict: 'user_id,phone', ignoreDuplicates: false }
    )

  if (error) return { error: error.message }
  revalidatePath('/dashboard/contacts')
  return { success: true }
}
