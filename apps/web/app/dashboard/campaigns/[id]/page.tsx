import { createAdminClient } from '@/lib/supabase/admin'
import { pauseCampaign, resumeCampaign } from '../actions'
import { Button } from '@/components/ui/button'
import { notFound } from 'next/navigation'
import { EditMessageForm } from './edit-message-form'
import { DeleteCampaignButton } from './delete-campaign-button'

export default async function CampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const admin = createAdminClient()

  const [{ data: campaign }, { data: stats }] = await Promise.all([
    admin.from('campaigns').select('*, campaign_messages(*)').eq('id', id).single(),
    admin.from('campaign_contacts').select('status').eq('campaign_id', id),
  ])

  if (!campaign) notFound()

  const counts = {
    total: stats?.length ?? 0,
    pending: stats?.filter(s => s.status === 'pending').length ?? 0,
    sent: stats?.filter(s => s.status === 'sent').length ?? 0,
    delivered: stats?.filter(s => s.status === 'delivered').length ?? 0,
    failed: stats?.filter(s => s.status === 'failed').length ?? 0,
    skipped: stats?.filter(s => s.status === 'skipped').length ?? 0,
  }

  const successRate = counts.total > 0
    ? Math.round((counts.delivered / counts.total) * 100)
    : 0

  const statusStyle: Record<string, string> = {
    draft: 'bg-[#f2f2f0] text-[#7a7a7a]', scheduled: 'bg-blue-50 text-blue-600',
    running: 'bg-amber-50 text-amber-600', paused: 'bg-orange-50 text-orange-500',
    done: 'bg-[#f0fdf4] text-[#25D366]', failed: 'bg-red-50 text-red-500',
  }
  const statusLabel: Record<string, string> = {
    draft: 'Draft', scheduled: 'Terjadwal', running: 'Berjalan',
    paused: 'Dijeda', done: 'Selesai', failed: 'Gagal',
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-[#111111]">{campaign.name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-[12px] px-2.5 py-1 rounded-full font-medium ${statusStyle[campaign.status]}`}>
              {statusLabel[campaign.status]}
            </span>
            {campaign.scheduled_at && (
              <span className="text-[13px] text-[#7a7a7a] font-mono">
                {new Date(campaign.scheduled_at).toLocaleString('id-ID')}
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          {campaign.status === 'running' && (
            <form action={async () => { 'use server'; await pauseCampaign(id) }}>
              <Button variant="outline" type="submit">Pause</Button>
            </form>
          )}
          {campaign.status === 'paused' && (
            <form action={async () => { 'use server'; await resumeCampaign(id) }}>
              <Button type="submit">Lanjutkan</Button>
            </form>
          )}
          <DeleteCampaignButton campaignId={id} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total Kontak', value: counts.total },
          { label: 'Terkirim', value: counts.sent },
          { label: 'Delivered', value: counts.delivered },
          { label: 'Gagal', value: counts.failed },
          { label: 'Dilewati', value: counts.skipped },
          { label: 'Success Rate', value: `${successRate}%` },
        ].map(stat => (
          <div key={stat.label} className="bg-white rounded-xl border border-[#e8e8e6] p-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-[#25D366]" />
            <p className="text-[12px] font-medium text-[#7a7a7a] uppercase tracking-wider">{stat.label}</p>
            <p className="text-2xl font-bold text-[#111111] mt-1 tabular-nums">{stat.value}</p>
          </div>
        ))}
      </div>

      {campaign.campaign_messages?.[0] && (
        <div className="bg-white rounded-xl border border-[#e8e8e6] p-5">
          <EditMessageForm
            messageId={campaign.campaign_messages[0].id}
            campaignId={id}
            initialContent={campaign.campaign_messages[0].content ?? ''}
          />
        </div>
      )}
    </div>
  )
}
