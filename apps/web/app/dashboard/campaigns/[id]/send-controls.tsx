'use client'

import { useState, useTransition } from 'react'
import { sendNowCampaign, scheduleCampaign } from '../actions'

export function SendControls({ campaignId }: { campaignId: string }) {
  const [mode, setMode] = useState<'now' | 'schedule' | null>(null)
  const [scheduledAt, setScheduledAt] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleSendNow() {
    startTransition(async () => {
      await sendNowCampaign(campaignId)
    })
  }

  function handleSchedule() {
    if (!scheduledAt) return
    startTransition(async () => {
      await scheduleCampaign(campaignId, scheduledAt)
    })
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Kirim Sekarang */}
      <button
        onClick={handleSendNow}
        disabled={isPending}
        className="h-8 px-3.5 rounded-lg bg-[#111111] text-white text-[13px] font-medium hover:bg-[#2a2a2a] transition-colors disabled:opacity-50"
      >
        {isPending && mode !== 'schedule' ? 'Mengirim...' : 'Kirim Sekarang'}
      </button>

      {/* Divider */}
      <span className="text-[#d0d0d0] text-[12px]">atau</span>

      {/* Jadwalkan */}
      {mode !== 'schedule' ? (
        <button
          onClick={() => setMode('schedule')}
          className="h-8 px-3.5 rounded-lg border border-[#e8e8e6] text-[13px] font-medium text-[#111111] hover:bg-[#f8f8f7] transition-colors"
        >
          Jadwalkan
        </button>
      ) : (
        <div className="flex items-center gap-2">
          <input
            type="datetime-local"
            value={scheduledAt}
            onChange={e => setScheduledAt(e.target.value)}
            className="h-8 px-2.5 rounded-lg border border-[#e8e8e6] bg-[#f8f8f7] text-[13px] outline-none focus:border-[#111111] transition-colors"
          />
          <button
            onClick={handleSchedule}
            disabled={!scheduledAt || isPending}
            className="h-8 px-3 rounded-lg bg-[#111111] text-white text-[13px] font-medium hover:bg-[#2a2a2a] transition-colors disabled:opacity-40"
          >
            {isPending ? 'Menyimpan...' : 'Simpan'}
          </button>
          <button
            onClick={() => setMode(null)}
            disabled={isPending}
            className="h-8 px-3 rounded-lg border border-[#e8e8e6] text-[13px] text-[#7a7a7a] hover:bg-[#f8f8f7] transition-colors"
          >
            Batal
          </button>
        </div>
      )}
    </div>
  )
}
