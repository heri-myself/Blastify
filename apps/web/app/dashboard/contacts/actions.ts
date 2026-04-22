'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function importContacts(contacts: Array<{ phone: string; name?: string; tags?: string }>) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const rows = contacts
    .filter(c => c.phone?.trim())
    .map(c => ({
      user_id: user.id,
      phone: c.phone.trim().replace(/\D/g, ''),
      name: c.name?.trim() || null,
      tags: c.tags ? c.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
    }))

  const { error } = await supabase
    .from('contacts')
    .upsert(rows, { onConflict: 'user_id,phone', ignoreDuplicates: false })

  if (error) return { error: error.message }
  revalidatePath('/dashboard/contacts')
  return { success: true, count: rows.length }
}

export async function deleteContact(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('contacts').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/dashboard/contacts')
  return { success: true }
}
