import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'

const statusStyle: Record<string, string> = {
  draft:      'bg-[#f2f2f0] text-[#7a7a7a]',
  scheduled:  'bg-blue-50 text-blue-600',
  running:    'bg-amber-50 text-amber-600',
  paused:     'bg-orange-50 text-orange-500',
  done:       'bg-[#f0fdf4] text-[#25D366]',
  failed:     'bg-red-50 text-red-500',
}

const statusLabel: Record<string, string> = {
  draft: 'Draft', scheduled: 'Terjadwal', running: 'Berjalan',
  paused: 'Dijeda', done: 'Selesai', failed: 'Gagal',
}

export default async function AdminCampaignsPage() {
  const admin = createAdminClient()

  const { data: { users } } = await admin.auth.admin.listUsers()
  const emailMap = Object.fromEntries(users.map(u => [u.id, u.email]))

  const { data: campaigns } = await admin
    .from('campaigns')
    .select('*, campaign_contacts(count)')
    .order('created_at', { ascending: false })

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-[#111111]">History Broadcast</h1>
        <p className="text-[13px] text-[#7a7a7a] mt-0.5">
          Seluruh campaign dari semua user — {campaigns?.length ?? 0} campaign total
        </p>
      </div>

      <div className="bg-white rounded-xl border border-[#e8e8e6] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#e8e8e6]">
              {['User', 'Nama Campaign', 'Status', 'Total Kontak', 'Jadwal', 'Dibuat', ''].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-[12px] font-medium text-[#7a7a7a] uppercase tracking-wider">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f2f2f0]">
            {campaigns?.map((c) => {
              const contactCount = (c.campaign_contacts as unknown as { count: number }[])?.[0]?.count ?? 0
              return (
                <tr key={c.id} className="hover:bg-[#f8f8f7] transition-colors">
                  <td className="px-4 py-3 text-[13px] text-[#7a7a7a]">
                    {emailMap[c.user_id] ?? c.user_id.slice(0, 8)}
                  </td>
                  <td className="px-4 py-3 text-[13px] font-medium text-[#111111]">{c.name}</td>
                  <td className="px-4 py-3">
                    <span className={`text-[12px] px-2.5 py-1 rounded-full font-medium ${statusStyle[c.status] ?? ''}`}>
                      {statusLabel[c.status] ?? c.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[13px] text-[#7a7a7a] tabular-nums">{contactCount.toLocaleString()}</td>
                  <td className="px-4 py-3 text-[13px] text-[#7a7a7a] font-mono">
                    {c.scheduled_at ? new Date(c.scheduled_at).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }) : '—'}
                  </td>
                  <td className="px-4 py-3 text-[13px] text-[#7a7a7a] font-mono">
                    {new Date(c.created_at).toLocaleDateString('id-ID')}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/dashboard/campaigns/${c.id}`}
                      className="text-[13px] font-medium text-[#111111] hover:text-[#25D366] transition-colors"
                    >
                      Detail →
                    </Link>
                  </td>
                </tr>
              )
            })}
            {!campaigns?.length && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-[#a0a0a0] text-[13px]">
                  Belum ada campaign.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
