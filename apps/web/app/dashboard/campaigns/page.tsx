import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { getUserRole } from '@/lib/get-user-role'
import { DeleteCampaignButton } from './delete-campaign-button'

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

export default async function CampaignsPage() {
  const profile = await getUserRole()
  const isSuperadmin = profile?.role === 'superadmin'
  const admin = createAdminClient()

  const query = admin.from('campaigns').select('*').order('created_at', { ascending: false })
  const { data: campaigns } = isSuperadmin
    ? await query
    : await query.eq('user_id', profile!.userId)

  let emailMap: Record<string, string> = {}
  if (isSuperadmin) {
    const { data: { users } } = await admin.auth.admin.listUsers()
    emailMap = Object.fromEntries(users.map(u => [u.id, u.email ?? u.id.slice(0, 8)]))
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-[#111111]">Campaign</h1>
          <p className="text-[13px] text-[#7a7a7a] mt-0.5">
            {isSuperadmin
              ? `Semua campaign dari seluruh user — ${campaigns?.length ?? 0} campaign`
              : 'Kelola broadcast campaign Anda'}
          </p>
        </div>
        {!isSuperadmin && (
          <Link
            href="/dashboard/campaigns/new"
            className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-[#111111] text-white text-[13px] font-medium hover:bg-[#2a2a2a] transition-colors"
          >
            + Buat Campaign
          </Link>
        )}
      </div>

      <div className="bg-white rounded-xl border border-[#e8e8e6] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#e8e8e6]">
              {isSuperadmin && <th className="text-left px-4 py-3 text-[12px] font-medium text-[#7a7a7a] uppercase tracking-wider">User</th>}
              <th className="text-left px-4 py-3 text-[12px] font-medium text-[#7a7a7a] uppercase tracking-wider">Nama</th>
              <th className="text-left px-4 py-3 text-[12px] font-medium text-[#7a7a7a] uppercase tracking-wider">Status</th>
              <th className="text-left px-4 py-3 text-[12px] font-medium text-[#7a7a7a] uppercase tracking-wider">Jadwal</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f2f2f0]">
            {campaigns?.map((campaign) => (
              <tr key={campaign.id} className="hover:bg-[#f8f8f7] transition-colors">
                {isSuperadmin && (
                  <td className="px-4 py-3 text-[13px] text-[#7a7a7a]">
                    {emailMap[campaign.user_id] ?? campaign.user_id.slice(0, 8)}
                  </td>
                )}
                <td className="px-4 py-3 font-medium text-[#111111]">{campaign.name}</td>
                <td className="px-4 py-3">
                  <span className={`text-[12px] px-2.5 py-1 rounded-full font-medium ${statusStyle[campaign.status]}`}>
                    {statusLabel[campaign.status]}
                  </span>
                </td>
                <td className="px-4 py-3 text-[13px] text-[#7a7a7a] font-mono">
                  {campaign.scheduled_at ? new Date(campaign.scheduled_at).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }) : '—'}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-3">
                    <Link href={`/dashboard/campaigns/${campaign.id}`} className="inline-flex items-center gap-1 h-7 px-3 rounded-lg bg-[#111111] text-white text-[12px] font-medium hover:bg-[#2a2a2a] transition-colors">
                      Detail →
                    </Link>
                    <DeleteCampaignButton campaignId={campaign.id} campaignName={campaign.name} />
                  </div>
                </td>
              </tr>
            ))}
            {!campaigns?.length && (
              <tr>
                <td colSpan={isSuperadmin ? 5 : 4} className="px-4 py-12 text-center text-[#a0a0a0] text-[13px]">
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
