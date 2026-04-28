import { createAdminClient } from '@/lib/supabase/admin'
import { getUserRole } from '@/lib/get-user-role'
import { StatCard } from '@/components/stat-card'
import { WorkerStatusBar } from '@/components/worker-status-bar'

export default async function DashboardPage() {
  const profile = await getUserRole()
  const isSuperadmin = profile?.role === 'superadmin'
  const admin = createAdminClient()

  const today = new Date().toISOString().split('T')[0]

  if (isSuperadmin) {
    // Superadmin: lihat semua data
    const [
      { count: totalContacts },
      { count: totalCampaigns },
      { count: sentToday },
      { data: senders },
    ] = await Promise.all([
      admin.from('contacts').select('*', { count: 'exact', head: true }),
      admin.from('campaigns').select('*', { count: 'exact', head: true }),
      admin.from('campaign_contacts').select('*', { count: 'exact', head: true })
        .eq('status', 'sent').gte('sent_at', today),
      admin.from('sender_phones').select('status'),
    ])
    const activeSenders = senders?.filter(s => s.status === 'active').length ?? 0

    return (
      <div>
        <div className="mb-4">
          <h1 className="text-xl font-semibold text-[#111111]">Overview</h1>
          <p className="text-[13px] text-[#7a7a7a] mt-0.5">Ringkasan seluruh aktivitas platform</p>
        </div>
        <WorkerStatusBar />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Kontak" value={totalContacts ?? 0} />
          <StatCard title="Total Campaign" value={totalCampaigns ?? 0} />
          <StatCard title="Terkirim Hari Ini" value={sentToday ?? 0} />
          <StatCard title="Sender Aktif" value={activeSenders} description={`dari ${senders?.length ?? 0} nomor`} />
        </div>
      </div>
    )
  }

  // User biasa: data miliknya saja
  const userId = profile!.userId
  const [
    { count: totalContacts },
    { count: totalCampaigns },
    { count: sentToday },
    { data: senders },
  ] = await Promise.all([
    admin.from('contacts').select('*', { count: 'exact', head: true }).eq('user_id', userId),
    admin.from('campaigns').select('*', { count: 'exact', head: true }).eq('user_id', userId),
    admin.from('campaign_contacts').select('*', { count: 'exact', head: true })
      .eq('status', 'sent').gte('sent_at', today),
    admin.from('sender_phones').select('status').eq('user_id', userId),
  ])
  const activeSenders = senders?.filter(s => s.status === 'active').length ?? 0

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-[#111111]">Overview</h1>
        <p className="text-[13px] text-[#7a7a7a] mt-0.5">Ringkasan aktivitas broadcast Anda</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Kontak" value={totalContacts ?? 0} />
        <StatCard title="Total Campaign" value={totalCampaigns ?? 0} />
        <StatCard title="Terkirim Hari Ini" value={sentToday ?? 0} />
        <StatCard title="Sender Aktif" value={activeSenders} description={`dari ${senders?.length ?? 0} nomor`} />
      </div>
    </div>
  )
}
