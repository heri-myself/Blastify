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
        className="h-8 px-3.5 rounded-lg bg-foreground text-background hover:opacity-90 transition-colors disabled:opacity-50"
      >
        {isPending && mode !== 'schedule' ? 'Mengirim...' : 'Kirim Sekarang'}
      </button>

      {/* Divider */}
      <span className="text-muted-foreground text-[12px]">atau</span>

      {/* Jadwalkan */}
      {mode !== 'schedule' ? (
        <button
          onClick={() => setMode('schedule')}
          className="h-8 px-3.5 rounded-lg border border-border text-[13px] font-medium text-foreground hover:bg-background transition-colors"
        >
          Jadwalkan
        </button>
      ) : (
        <div className="flex items-center gap-2">
          <input
            type="datetime-local"
            value={scheduledAt}
            onChange={e => setScheduledAt(e.target.value)}
            className="h-8 px-2.5 rounded-lg border border-border bg-background text-[13px] outline-none focus:border-accent transition-colors"
          />
          <button
            onClick={handleSchedule}
            disabled={!scheduledAt || isPending}
            className="h-8 px-3 rounded-lg bg-foreground text-background hover:opacity-90 transition-colors disabled:opacity-40"
          >
            {isPending ? 'Menyimpan...' : 'Simpan'}
          </button>
          <button
            onClick={() => setMode(null)}
            disabled={isPending}
            className="h-8 px-3 rounded-lg border border-border text-[13px] text-muted-foreground hover:bg-background transition-colors"
          >
            Batal
          </button>
        </div>
      )}
    </div>
  )
}
