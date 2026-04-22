'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

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
  const { error } = await supabase.from('sender_phones').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/dashboard/senders')
  return { success: true }
}
