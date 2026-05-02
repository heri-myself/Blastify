import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { getUserRole } from '@/lib/get-user-role'
import { DeleteCampaignButton } from './delete-campaign-button'

const statusStyle: Record<string, string> = {
  draft:      'bg-secondary text-muted-foreground',
  scheduled:  'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400',
  running:    'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400',
  paused:     'bg-orange-50 text-orange-500 dark:bg-orange-950/40 dark:text-orange-400',
  done:       'bg-[#f0fdf4] text-[#25D366] dark:bg-[#25D366]/10',
  failed:     'bg-red-50 text-red-500 dark:bg-red-950/40 dark:text-red-400',
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
          <h1 className="text-xl font-semibold text-foreground">Campaign</h1>
          <p className="text-[13px] text-muted-foreground mt-0.5">
            {isSuperadmin
              ? `Semua campaign dari seluruh user — ${campaigns?.length ?? 0} campaign`
              : 'Kelola broadcast campaign Anda'}
          </p>
        </div>
        {!isSuperadmin && (
          <Link
            href="/dashboard/campaigns/new"
            className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-foreground text-background text-[13px] font-medium hover:opacity-90 transition-opacity"
          >
            + Buat Campaign
          </Link>
        )}
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              {isSuperadmin && <th className="text-left px-4 py-3 text-[12px] font-medium text-muted-foreground uppercase tracking-wider">User</th>}
              <th className="text-left px-4 py-3 text-[12px] font-medium text-muted-foreground uppercase tracking-wider">Nama</th>
              <th className="text-left px-4 py-3 text-[12px] font-medium text-muted-foreground uppercase tracking-wider">Status</th>
              <th className="text-left px-4 py-3 text-[12px] font-medium text-muted-foreground uppercase tracking-wider">Jadwal</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {campaigns?.map((campaign) => (
              <tr key={campaign.id} className="hover:bg-secondary/50 transition-colors">
                {isSuperadmin && (
                  <td className="px-4 py-3 text-[13px] text-muted-foreground">
                    {emailMap[campaign.user_id] ?? campaign.user_id.slice(0, 8)}
                  </td>
                )}
                <td className="px-4 py-3 font-medium text-foreground">{campaign.name}</td>
                <td className="px-4 py-3">
                  <span className={`text-[12px] px-2.5 py-1 rounded-full font-medium ${statusStyle[campaign.status]}`}>
                    {statusLabel[campaign.status]}
                  </span>
                </td>
                <td className="px-4 py-3 text-[13px] text-muted-foreground font-mono">
                  {campaign.scheduled_at ? new Date(campaign.scheduled_at).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }) : '—'}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-3">
                    <Link href={`/dashboard/campaigns/${campaign.id}`} className="inline-flex items-center gap-1 h-7 px-3 rounded-lg bg-foreground text-background text-[12px] font-medium hover:opacity-90 transition-opacity">
                      Detail →
                    </Link>
                    <DeleteCampaignButton campaignId={campaign.id} campaignName={campaign.name} />
                  </div>
                </td>
              </tr>
            ))}
            {!campaigns?.length && (
              <tr>
                <td colSpan={isSuperadmin ? 5 : 4} className="px-4 py-12 text-center text-muted-foreground text-[13px]">
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
