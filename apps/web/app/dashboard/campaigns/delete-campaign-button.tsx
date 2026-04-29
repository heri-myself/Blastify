'use client'

import { useState } from 'react'
import { deleteCampaign } from './actions'

const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6M14 11v6" />
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  </svg>
)

interface Props {
  campaignId: string
  campaignName?: string
  variant?: 'icon' | 'button'
}

export function DeleteCampaignButton({ campaignId, campaignName, variant = 'icon' }: Props) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleConfirm() {
    setLoading(true)
    await deleteCampaign(campaignId)
    setLoading(false)
    setOpen(false)
  }

  return (
    <>
      {variant === 'icon' ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          title="Hapus campaign"
          className="text-[#a0a0a0] hover:text-red-500 transition-colors p-1 rounded-md hover:bg-red-50"
        >
          <TrashIcon />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 text-red-500 text-[13px] font-medium hover:bg-red-50 hover:border-red-300 transition-colors"
        >
          <TrashIcon />
          Hapus Campaign
        </button>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => !loading && setOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-50 mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                <path d="M10 11v6M14 11v6" />
                <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
              </svg>
            </div>
            <h3 className="text-[15px] font-semibold text-[#111111] text-center mb-1">Hapus Campaign?</h3>
            <p className="text-[13px] text-[#7a7a7a] text-center mb-5">
              {campaignName ? (
                <>Campaign <span className="font-medium text-[#111111]">"{campaignName}"</span> akan dihapus permanen beserta semua data kontak dan pesan.</>
              ) : (
                'Campaign akan dihapus permanen beserta semua data kontak dan pesan.'
              )}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={loading}
                className="flex-1 h-9 rounded-lg border border-[#e8e8e6] text-[13px] font-medium text-[#111111] hover:bg-[#f8f8f7] transition-colors disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={loading}
                className="flex-1 h-9 rounded-lg bg-red-500 text-white text-[13px] font-medium hover:bg-red-600 transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-1.5"
              >
                {loading && (
                  <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                )}
                {loading ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
