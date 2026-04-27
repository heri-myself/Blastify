import { removeContactFromCampaign, retryContactBroadcast, removePendingContacts } from './contact-actions'

interface CampaignContact {
  id: string
  contact_id: string
  status: string
  sent_at: string | null
  error_code: string | null
  contacts: { name: string | null; phone: string } | null
}

interface Props {
  campaignId: string
  campaignContacts: CampaignContact[]
}

const statusBadge: Record<string, string> = {
  pending:   'bg-orange-50 text-orange-500',
  sending:   'bg-blue-50 text-blue-600',
  sent:      'bg-blue-50 text-blue-600',
  delivered: 'bg-[#f0fdf4] text-[#25D366]',
  failed:    'bg-red-50 text-red-500',
  skipped:   'bg-orange-50 text-orange-500',
}

const statusLabel: Record<string, string> = {
  pending:   'Pending',
  sending:   'Mengirim',
  sent:      'Terkirim',
  delivered: 'Delivered',
  failed:    'Gagal',
  skipped:   'Dilewati',
}

export function CampaignContactList({ campaignId, campaignContacts }: Props) {
  const pendingCount = campaignContacts.filter(c => c.status === 'pending').length

  if (campaignContacts.length === 0) {
    return (
      <p className="text-[13px] text-[#a0a0a0] py-4">
        Belum ada kontak. Tambah kontak di bawah.
      </p>
    )
  }

  return (
    <div>
      {pendingCount > 0 && (
        <div className="flex justify-end mb-3">
          <form action={async () => {
            'use server'
            await removePendingContacts(campaignId)
          }}>
            <button
              type="submit"
              className="text-[12px] text-red-500 hover:text-red-700 transition-colors"
            >
              Hapus Semua Pending ({pendingCount})
            </button>
          </form>
        </div>
      )}
      <div className="overflow-hidden rounded-xl border border-[#e8e8e6]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#e8e8e6]">
              <th className="text-left px-4 py-3 text-[12px] font-medium text-[#7a7a7a] uppercase tracking-wider">Nama</th>
              <th className="text-left px-4 py-3 text-[12px] font-medium text-[#7a7a7a] uppercase tracking-wider">Nomor</th>
              <th className="text-left px-4 py-3 text-[12px] font-medium text-[#7a7a7a] uppercase tracking-wider">Status</th>
              <th className="text-left px-4 py-3 text-[12px] font-medium text-[#7a7a7a] uppercase tracking-wider">Waktu Kirim</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f2f2f0]">
            {campaignContacts.map(cc => (
              <tr key={cc.id} className="hover:bg-[#f8f8f7] transition-colors">
                <td className="px-4 py-3 text-[13px] text-[#111111]">{cc.contacts?.name ?? '—'}</td>
                <td className="px-4 py-3 font-mono text-[13px] text-[#111111]">{cc.contacts?.phone ?? '—'}</td>
                <td className="px-4 py-3">
                  <span className={`text-[12px] px-2.5 py-1 rounded-full font-medium ${statusBadge[cc.status] ?? statusBadge.pending}`}>
                    {statusLabel[cc.status] ?? cc.status}
                  </span>
                  {cc.error_code && (
                    <span className="ml-2 text-[11px] text-red-400">{cc.error_code}</span>
                  )}
                </td>
                <td className="px-4 py-3 text-[13px] text-[#7a7a7a]">
                  {cc.sent_at ? new Date(cc.sent_at).toLocaleString('id-ID') : '—'}
                </td>
                <td className="px-4 py-3 text-right">
                  {cc.status === 'pending' && (
                    <form action={async () => {
                      'use server'
                      await removeContactFromCampaign(cc.id, campaignId)
                    }}>
                      <button type="submit" className="text-[13px] text-[#a0a0a0] hover:text-red-500 transition-colors font-medium">
                        Hapus
                      </button>
                    </form>
                  )}
                  {cc.status === 'failed' && (
                    <form action={async () => {
                      'use server'
                      await retryContactBroadcast(cc.id, campaignId)
                    }}>
                      <button type="submit" className="text-[13px] text-[#a0a0a0] hover:text-blue-500 transition-colors font-medium">
                        Retry
                      </button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
