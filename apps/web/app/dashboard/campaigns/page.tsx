import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

const statusStyle: Record<string, string> = {
  draft:      'bg-[#f2f2f0] text-[#7a7a7a]',
  scheduled:  'bg-blue-50 text-blue-600',
  running:    'bg-amber-50 text-amber-600',
  paused:     'bg-orange-50 text-orange-600',
  done:       'bg-[#f0fdf4] text-[#25D366]',
  failed:     'bg-red-50 text-red-500',
}

const statusLabel: Record<string, string> = {
  draft: 'Draft', scheduled: 'Terjadwal', running: 'Berjalan',
  paused: 'Dijeda', done: 'Selesai', failed: 'Gagal',
}

export default async function CampaignsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: campaigns } = await supabase
    .from('campaigns')
    .select('*')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-[#111111]">Campaign</h1>
          <p className="text-[13px] text-[#7a7a7a] mt-0.5">Kelola broadcast campaign Anda</p>
        </div>
        <Link
          href="/dashboard/campaigns/new"
          className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-[#111111] text-white text-[13px] font-medium hover:bg-[#2a2a2a] transition-colors"
        >
          + Buat Campaign
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-[#e8e8e6] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#e8e8e6]">
              <th className="text-left px-4 py-3 text-[12px] font-medium text-[#7a7a7a] uppercase tracking-wider">Nama</th>
              <th className="text-left px-4 py-3 text-[12px] font-medium text-[#7a7a7a] uppercase tracking-wider">Status</th>
              <th className="text-left px-4 py-3 text-[12px] font-medium text-[#7a7a7a] uppercase tracking-wider">Jadwal</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f2f2f0]">
            {campaigns?.map((campaign) => (
              <tr key={campaign.id} className="hover:bg-[#f8f8f7] transition-colors">
                <td className="px-4 py-3 font-medium text-[#111111]">{campaign.name}</td>
                <td className="px-4 py-3">
                  <span className={`text-[12px] px-2.5 py-1 rounded-full font-medium ${statusStyle[campaign.status]}`}>
                    {statusLabel[campaign.status]}
                  </span>
                </td>
                <td className="px-4 py-3 text-[13px] text-[#7a7a7a] font-mono">
                  {campaign.scheduled_at
                    ? new Date(campaign.scheduled_at).toLocaleString('id-ID')
                    : '—'}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/dashboard/campaigns/${campaign.id}`}
                    className="text-[13px] font-medium text-[#111111] hover:text-[#25D366] transition-colors"
                  >
                    Detail →
                  </Link>
                </td>
              </tr>
            ))}
            {!campaigns?.length && (
              <tr>
                <td colSpan={4} className="px-4 py-12 text-center text-[#a0a0a0] text-[13px]">
                  Belum ada campaign. Mulai dengan membuat campaign baru.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
