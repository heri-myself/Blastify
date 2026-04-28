'use client'

import { useState, useEffect } from 'react'

export function CsvImportWarning() {
  const [dismissed, setDismissed] = useState(false)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const isDismissed = localStorage.getItem('csv-warning-dismissed') === '1'
    if (!isDismissed) setVisible(true)
  }, [])

  function dismiss() {
    setDismissed(true)
    setTimeout(() => {
      localStorage.setItem('csv-warning-dismissed', '1')
      setVisible(false)
    }, 300)
  }

  if (!visible) return null

  return (
    <div
      className={`mb-5 transition-all duration-300 ${dismissed ? 'opacity-0 -translate-y-1' : 'opacity-100 translate-y-0'}`}
    >
      <div className="relative rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 overflow-hidden">
        {/* Left accent bar */}
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-400 rounded-l-xl" />

        <div className="flex items-start justify-between gap-4 pl-2">
          <div className="flex items-start gap-3">
            {/* Icon */}
            <div className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-amber-400 flex items-center justify-center">
              <span className="text-white text-[11px] font-bold leading-none">!</span>
            </div>

            <div>
              <p className="text-[13px] font-semibold text-amber-900 mb-2">
                Cek data CSV sebelum import untuk menghindari error
              </p>
              <ul className="space-y-1">
                {[
                  <>Pastikan kolom bernama <code className="bg-amber-100 border border-amber-200 px-1 py-0.5 rounded text-[11px] font-mono">phone</code> / <code className="bg-amber-100 border border-amber-200 px-1 py-0.5 rounded text-[11px] font-mono">nomor</code> / <code className="bg-amber-100 border border-amber-200 px-1 py-0.5 rounded text-[11px] font-mono">no_hp</code> ada di baris pertama</>,
                  <>Tidak ada <span className="font-semibold">nomor telepon duplikat</span> dalam satu file — duplikat menyebabkan error import</>,
                  <>Nomor HP tanpa spasi atau karakter aneh. Format: <code className="bg-amber-100 border border-amber-200 px-1 py-0.5 rounded text-[11px] font-mono">628xxx</code> atau <code className="bg-amber-100 border border-amber-200 px-1 py-0.5 rounded text-[11px] font-mono">08xxx</code></>,
                  <>Kolom opsional: <code className="bg-amber-100 border border-amber-200 px-1 py-0.5 rounded text-[11px] font-mono">name</code> / <code className="bg-amber-100 border border-amber-200 px-1 py-0.5 rounded text-[11px] font-mono">nama</code> dan <code className="bg-amber-100 border border-amber-200 px-1 py-0.5 rounded text-[11px] font-mono">tags</code> (pisah koma)</>,
                  <>Hapus baris kosong di bagian bawah file sebelum save</>,
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-[12px] text-amber-800">
                    <span className="mt-0.5 w-1 h-1 rounded-full bg-amber-400 flex-shrink-0 mt-[6px]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Dismiss button */}
          <button
            onClick={dismiss}
            className="flex-shrink-0 mt-0.5 text-amber-400 hover:text-amber-600 transition-colors"
            aria-label="Tutup"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Dismiss forever link */}
        <div className="mt-3 pl-10">
          <button
            onClick={dismiss}
            className="text-[11px] text-amber-500 hover:text-amber-700 underline underline-offset-2 transition-colors"
          >
            Mengerti, jangan tampilkan lagi
          </button>
        </div>
      </div>
    </div>
  )
}
