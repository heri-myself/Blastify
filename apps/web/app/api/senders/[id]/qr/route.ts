import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: sender } = await supabase
    .from('sender_phones')
    .select('session_data, status, user_id')
    .eq('id', id)
    .single()

  if (!sender || sender.user_id !== user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const sessionData = sender.session_data as Record<string, unknown> | null
  return NextResponse.json({
    qr: sessionData?.qr ?? null,
    connected: sessionData?.connected ?? false,
    status: sender.status,
  })
}
