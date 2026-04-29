'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
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

const Spinner = () => (
  <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
  </svg>
)

function RemoveContactButton({ ccId, campaignId }: { ccId: string; campaignId: string }) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  return (
    <button
      onClick={() => startTransition(async () => {
        await removeContactFromCampaign(ccId, campaignId)
        router.refresh()
      })}
      disabled={isPending}
      className="inline-flex items-center gap-1 text-[13px] text-[#a0a0a0] hover:text-red-500 transition-colors font-medium disabled:opacity-50"
    >
      {isPending ? <Spinner /> : 'Hapus'}
    </button>
  )
}

function RetryContactButton({ ccId, campaignId }: { ccId: string; campaignId: string }) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  return (
    <button
      onClick={() => startTransition(async () => {
        await retryContactBroadcast(ccId, campaignId)
        router.refresh()
      })}
      disabled={isPending}
      className="inline-flex items-center gap-1 text-[13px] text-[#a0a0a0] hover:text-blue-500 transition-colors font-medium disabled:opacity-50"
    >
      {isPending ? <Spinner /> : 'Retry'}
    </button>
  )
}

function RemoveAllPendingButton({ campaignId, pendingCount }: { campaignId: string; pendingCount: number }) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  return (
    <button
      onClick={() => startTransition(async () => {
        await removePendingContacts(campaignId)
        router.refresh()
      })}
      disabled={isPending}
      className="inline-flex items-center gap-1.5 text-[12px] text-red-500 hover:text-red-700 transition-colors disabled:opacity-50"
    >
      {isPending && <Spinner />}
      {isPending ? 'Menghapus...' : `Hapus Semua Pending (${pendingCount})`}
    </button>
  )
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
          <RemoveAllPendingButton campaignId={campaignId} pendingCount={pendingCount} />
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
                  {cc.sent_at ? new Date(cc.sent_at).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }) : '—'}
                </td>
                <td className="px-4 py-3 text-right">
                  {cc.status === 'pending' && (
                    <RemoveContactButton ccId={cc.id} campaignId={campaignId} />
                  )}
                  {cc.status === 'failed' && (
                    <RetryContactButton ccId={cc.id} campaignId={campaignId} />
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
