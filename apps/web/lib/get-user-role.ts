import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function getUserRole(): Promise<{ userId: string; email: string; role: string; isActive: boolean } | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('profiles')
    .select('role, is_active')
    .eq('id', user.id)
    .single()

  return {
    userId: user.id,
    email: user.email ?? '',
    role: profile?.role ?? 'user',
    isActive: profile?.is_active ?? true,
  }
}
