import { createAdminClient } from '@/lib/supabase/admin'

const statusStyle: Record<string, string> = {
  active:      'bg-[#f0fdf4] text-[#25D366]',
  warmup:      'bg-amber-50 text-amber-600',
  soft_banned: 'bg-red-50 text-red-500',
  recovering:  'bg-orange-50 text-orange-500',
  disabled:    'bg-secondary text-muted-foreground',
}

const statusLabel: Record<string, string> = {
  active: 'Aktif', warmup: 'Warm-up', soft_banned: 'Soft Banned',
  recovering: 'Pemulihan', disabled: 'Nonaktif',
}

export default async function AdminSendersPage() {
  const admin = createAdminClient()

  const { data: { users } } = await admin.auth.admin.listUsers()
  const emailMap = Object.fromEntries(users.map(u => [u.id, u.email]))

  const { data: senders } = await admin
    .from('sender_phones')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-foreground">Semua Sender WA</h1>
        <p className="text-[13px] text-muted-foreground mt-0.5">
          Seluruh nomor sender dari semua user — {senders?.length ?? 0} nomor total
        </p>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              {['User', 'Nomor', 'Nama', 'Status', 'Warmup', 'Terkirim Hari Ini', 'Dibuat'].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-[12px] font-medium text-muted-foreground uppercase tracking-wider">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {senders?.map((s) => (
              <tr key={s.id} className="hover:bg-background transition-colors">
                <td className="px-4 py-3 text-[13px] text-muted-foreground">{emailMap[s.user_id] ?? s.user_id.slice(0, 8)}</td>
                <td className="px-4 py-3 font-mono text-[13px] text-foreground">{s.phone_number}</td>
                <td className="px-4 py-3 text-[13px] text-foreground">{s.display_name ?? '—'}</td>
                <td className="px-4 py-3">
                  <span className={`text-[12px] px-2.5 py-1 rounded-full font-medium ${statusStyle[s.status] ?? 'bg-secondary text-muted-foreground'}`}>
                    {statusLabel[s.status] ?? s.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-[13px] text-muted-foreground">{s.warmup_day}/14</td>
                <td className="px-4 py-3 text-[13px] text-muted-foreground">{s.daily_sent}</td>
                <td className="px-4 py-3 text-[13px] text-muted-foreground font-mono">
                  {new Date(s.created_at).toLocaleDateString('id-ID')}
                </td>
              </tr>
            ))}
            {!senders?.length && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground text-[13px]">
                  Belum ada sender.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
