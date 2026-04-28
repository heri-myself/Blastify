'use client'

import { useEffect, useState } from 'react'

interface WorkerStatus {
  worker: {
    online: boolean
    lastSeen: string | null
    secondsAgo: number
    version: string | null
    campaignsRunning: number
    campaignsQueued: number
    messagesSentToday: number
  }
  campaigns: {
    scheduled: number
    running: number
  }
  senders: Array<{
    id: string
    phone: string
    status: string
    connected: boolean
  }>
}

export function WorkerStatusBar() {
  const [status, setStatus] = useState<WorkerStatus | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const doFetch = async () => {
      try {
        const res = await window.fetch('/api/worker/status')
        const data = await res.json()
        setStatus(data)
      } catch {
        setStatus(null)
      } finally {
        setLoading(false)
      }
    }

    doFetch()
    const interval = setInterval(doFetch, 10_000)
    return () => clearInterval(interval)
  }, [])

  const connectedSenders = status?.senders.filter(s => s.connected).length ?? 0
  const totalSenders = status?.senders.length ?? 0
  const isOnline = status?.worker.online ?? false

  // Sembunyikan jika user tidak punya sender
  if (!loading && totalSenders === 0) return null
  const running = status?.campaigns.running ?? 0
  const scheduled = status?.campaigns.scheduled ?? 0
  const sentToday = status?.worker.messagesSentToday ?? 0

  return (
    <div className="flex rounded-xl border border-[#e8e8e6] bg-white overflow-hidden shadow-sm text-[12px] mb-6">

      {/* Worker Engine */}
      <div className="flex flex-col justify-center px-5 py-3 border-r border-[#e8e8e6] flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-[#b0b0b0] mb-1">Worker Engine</p>
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5 shrink-0">
            {loading ? (
              <span className="h-2.5 w-2.5 rounded-full bg-gray-200" />
            ) : isOnline ? (
              <>
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#25D366] opacity-50" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#25D366]" />
              </>
            ) : (
              <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
            )}
          </span>
          <span className={`font-semibold ${loading ? 'text-[#ccc]' : isOnline ? 'text-[#111]' : 'text-red-500'}`}>
            {loading ? 'Memuat...' : isOnline ? 'Online' : 'Offline'}
          </span>
          {!loading && isOnline && (status?.worker.secondsAgo ?? 0) > 0 && (
            <span className="text-[10px] text-[#ccc]">{status!.worker.secondsAgo}s ago</span>
          )}
        </div>
      </div>

      {/* Sender WA */}
      <div className="flex flex-col justify-center px-5 py-3 border-r border-[#e8e8e6] flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-[#b0b0b0] mb-1">Sender WA</p>
        <div className="flex items-baseline gap-1">
          <span className={`text-lg font-bold tabular-nums leading-none ${connectedSenders > 0 ? 'text-[#25D366]' : 'text-[#ccc]'}`}>
            {connectedSenders}
          </span>
          <span className="text-[#ccc] font-light text-base leading-none">/</span>
          <span className="text-[#111] font-semibold text-base leading-none">{totalSenders}</span>
          <span className="text-[#b0b0b0] ml-1">terhubung</span>
        </div>
      </div>

      {/* Campaign */}
      <div className="flex flex-col justify-center px-5 py-3 border-r border-[#e8e8e6] flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-[#b0b0b0] mb-1">Campaign</p>
        <div className="flex items-center gap-2 flex-wrap">
          {running > 0 ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 font-semibold text-[11px]">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              {running} Berjalan
            </span>
          ) : (
            <span className="text-[#b0b0b0] font-medium">Idle</span>
          )}
          {scheduled > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-500 font-semibold text-[11px]">
              {scheduled} Terjadwal
            </span>
          )}
        </div>
      </div>

      {/* Messages Today */}
      <div className="flex flex-col justify-center px-5 py-3 flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-[#b0b0b0] mb-1">Terkirim Hari Ini</p>
        <div className="flex items-baseline gap-1">
          <span className="text-lg font-bold tabular-nums text-[#111] leading-none">{sentToday}</span>
          <span className="text-[#b0b0b0]">pesan</span>
        </div>
      </div>

    </div>
  )
}
