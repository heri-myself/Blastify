import { createAdminClient } from '@/lib/supabase/admin'
import { getUserRole } from '@/lib/get-user-role'
import { NextResponse } from 'next/server'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const profile = await getUserRole()
  if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { data: sender } = await admin
    .from('sender_phones')
    .select('session_data, status, user_id')
    .eq('id', id)
    .single()

  if (!sender) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // User biasa hanya bisa akses sender miliknya sendiri
  if (profile.role !== 'superadmin' && sender.user_id !== profile.userId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const sessionData = sender.session_data as Record<string, unknown> | null
  return NextResponse.json({
    qr: sessionData?.qr ?? null,
    connected: sessionData?.connected ?? false,
    status: sender.status,
  })
}
