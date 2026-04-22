'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function deleteMedia(id: string, storagePath: string) {
  const supabase = await createClient()
  await supabase.storage.from('media').remove([storagePath])
  const { error } = await supabase.from('media_files').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/dashboard/media')
  return { success: true }
}
