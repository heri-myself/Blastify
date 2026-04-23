import { createClient } from '@/lib/supabase/server'
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
  const supabase = await createClient()

  const [{ data: campaign }, { data: stats }] = await Promise.all([
    supabase.from('campaigns').select('*, campaign_messages(*)').eq('id', id).single(),
    supabase.from('campaign_contacts').select('status').eq('campaign_id', id),
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

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{campaign.name}</h1>
          <p className="text-sm text-gray-500 mt-1">
            Status: <strong>{campaign.status}</strong>
            {campaign.scheduled_at && (
              <> · Jadwal: {new Date(campaign.scheduled_at).toLocaleString('id-ID')}</>
            )}
          </p>
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
          <div key={stat.label} className="bg-white rounded-lg border p-4">
            <p className="text-sm text-gray-500">{stat.label}</p>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
          </div>
        ))}
      </div>

      {campaign.campaign_messages?.[0] && (
        <div className="bg-white rounded-lg border p-4">
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
