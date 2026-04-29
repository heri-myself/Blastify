'use client'

import { useState, useTransition } from 'react'
import { deleteSender } from './actions'

export function DeleteSenderButton({ senderId, phoneNumber }: { senderId: string; phoneNumber: string }) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleConfirm() {
    setError(null)
    startTransition(async () => {
      const result = await deleteSender(senderId)
      if (result?.error) {
        setError(result.error)
      } else {
        setOpen(false)
      }
    })
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-[#a0a0a0] hover:text-red-500 transition-colors p-1 rounded-md hover:bg-red-50"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="3 6 5 6 21 6"/>
          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
          <path d="M10 11v6M14 11v6"/>
          <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
        </svg>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => !isPending && setOpen(false)}
          />

          {/* Dialog */}
          <div className="relative bg-white rounded-2xl shadow-xl border border-[#e8e8e6] w-full max-w-sm mx-4 overflow-hidden">
            {/* Top accent */}
            <div className="h-1 bg-red-500 w-full" />

            <div className="p-6">
              {/* Icon */}
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                  <path d="M10 11v6M14 11v6"/>
                  <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                </svg>
              </div>

              <h3 className="text-[15px] font-semibold text-[#111111] mb-1">Hapus Sender?</h3>
              <p className="text-[13px] text-[#7a7a7a] mb-1">
                Nomor <span className="font-mono font-medium text-[#111111]">{phoneNumber}</span> akan dihapus permanen.
              </p>
              <p className="text-[12px] text-[#a0a0a0]">Sesi WhatsApp dan riwayat pengiriman akan ikut terhapus.</p>
              {error && <p className="text-[12px] text-red-500 mt-2">{error}</p>}
            </div>

            <div className="px-6 pb-6 flex gap-2.5">
              <button
                onClick={() => setOpen(false)}
                disabled={isPending}
                className="flex-1 h-9 rounded-lg border border-[#e8e8e6] text-[13px] font-medium text-[#111111] hover:bg-[#f8f8f7] transition-colors disabled:opacity-50"
              >
                Batal
              </button>
              <button
                onClick={handleConfirm}
                disabled={isPending}
                className="flex-1 h-9 rounded-lg bg-red-500 text-white text-[13px] font-medium hover:bg-red-600 transition-colors disabled:opacity-70 flex items-center justify-center gap-1.5"
              >
                {isPending ? (
                  <>
                    <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                    </svg>
                    Menghapus...
                  </>
                ) : 'Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
