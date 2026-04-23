import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'

const statusColor: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600',
  scheduled: 'bg-blue-100 text-blue-700',
  running: 'bg-yellow-100 text-yellow-700',
  paused: 'bg-orange-100 text-orange-700',
  done: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
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
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">Campaign</h1>
          <a href="/panduan-anti-banned.html" target="_blank"
            className="text-xs text-blue-600 hover:underline font-medium">
            📋 Panduan Anti-Banned
          </a>
        </div>
        <Link href="/dashboard/campaigns/new"
          className="inline-flex items-center justify-center rounded-lg border border-transparent bg-primary text-primary-foreground px-2.5 h-8 text-sm font-medium transition-all hover:opacity-90">
          + Buat Campaign
        </Link>
      </div>
      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Nama</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Jadwal</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {campaigns?.map((campaign) => (
              <tr key={campaign.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{campaign.name}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColor[campaign.status]}`}>
                    {campaign.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-400 text-xs">
                  {campaign.scheduled_at
                    ? new Date(campaign.scheduled_at).toLocaleString('id-ID')
                    : '-'}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/dashboard/campaigns/${campaign.id}`}
                    className="inline-flex items-center justify-center rounded-lg h-7 px-2.5 text-[0.8rem] font-medium hover:bg-muted hover:text-foreground transition-all">
                    Detail
                  </Link>
                </td>
              </tr>
            ))}
            {!campaigns?.length && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-gray-400">
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
