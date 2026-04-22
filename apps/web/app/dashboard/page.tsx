import { createClient } from '@/lib/supabase/server'
import { StatCard } from '@/components/stat-card'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [
    { count: totalContacts },
    { count: totalCampaigns },
    { count: sentToday },
    { data: senders },
  ] = await Promise.all([
    supabase.from('contacts').select('*', { count: 'exact', head: true }).eq('user_id', user!.id),
    supabase.from('campaigns').select('*', { count: 'exact', head: true }).eq('user_id', user!.id),
    supabase.from('campaign_contacts').select('*', { count: 'exact', head: true })
      .eq('status', 'sent')
      .gte('sent_at', new Date().toISOString().split('T')[0]),
    supabase.from('sender_phones').select('status').eq('user_id', user!.id),
  ])

  const activeSenders = senders?.filter(s => s.status === 'active').length ?? 0

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Overview</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Kontak" value={totalContacts ?? 0} />
        <StatCard title="Total Campaign" value={totalCampaigns ?? 0} />
        <StatCard title="Terkirim Hari Ini" value={sentToday ?? 0} />
        <StatCard
          title="Sender Aktif"
          value={activeSenders}
          description={`dari ${senders?.length ?? 0} nomor`}
        />
      </div>
    </div>
  )
}
