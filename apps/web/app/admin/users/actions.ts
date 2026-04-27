'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { getUserRole } from '@/lib/get-user-role'

async function requireSuperadmin() {
  const profile = await getUserRole()
  if (!profile || profile.role !== 'superadmin') throw new Error('Unauthorized')
}

export async function createUser(formData: FormData) {
  await requireSuperadmin()
  const admin = createAdminClient()

  const email = (formData.get('email') as string).trim()
  const password = formData.get('password') as string

  const { error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { role: 'user' },
  })

  if (error) return { error: error.message }
  revalidatePath('/admin/users')
  return { success: true }
}

export async function toggleUserActive(userId: string, isActive: boolean) {
  await requireSuperadmin()
  const admin = createAdminClient()
  const supabase = admin

  const { error } = await supabase
    .from('profiles')
    .update({ is_active: isActive })
    .eq('id', userId)

  if (error) return { error: error.message }
  revalidatePath('/admin/users')
  return { success: true }
}

export async function deleteUser(userId: string) {
  await requireSuperadmin()
  const admin = createAdminClient()

  const { error } = await admin.auth.admin.deleteUser(userId)
  if (error) return { error: error.message }
  revalidatePath('/admin/users')
  return { success: true }
}
