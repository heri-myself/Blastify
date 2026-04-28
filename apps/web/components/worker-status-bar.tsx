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
    const fetch = async () => {
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

    fetch()
    const interval = setInterval(fetch, 10_000)
    return () => clearInterval(interval)
  }, [])

  const connectedSenders = status?.senders.filter(s => s.connected).length ?? 0
  const totalSenders = status?.senders.length ?? 0
  const isOnline = status?.worker.online ?? false

  return (
    <div className="flex items-center gap-4 px-4 py-2 bg-white border-b border-[#e8e8e6] text-[12px] text-[#7a7a7a]">
      {/* Worker Status */}
      <div className="flex items-center gap-1.5">
        <span className={`w-2 h-2 rounded-full ${loading ? 'bg-gray-300' : isOnline ? 'bg-[#25D366] animate-pulse' : 'bg-red-400'}`} />
        <span className="font-medium text-[#111111]">Worker</span>
        <span>{loading ? 'Memuat...' : isOnline ? 'Online' : 'Offline'}</span>
        {!loading && isOnline && (status?.worker.secondsAgo ?? 0) > 0 && (
          <span className="text-[#bbb]">({status!.worker.secondsAgo}s ago)</span>
        )}
      </div>

      <span className="text-[#e8e8e6]">|</span>

      {/* Senders */}
      <div className="flex items-center gap-1.5">
        <span className="font-medium text-[#111111]">Sender</span>
        <span className={connectedSenders > 0 ? 'text-[#25D366] font-medium' : ''}>
          {connectedSenders}/{totalSenders}
        </span>
        <span>terhubung</span>
      </div>

      <span className="text-[#e8e8e6]">|</span>

      {/* Campaign Status */}
      <div className="flex items-center gap-1.5">
        <span className="font-medium text-[#111111]">Campaign</span>
        {(status?.campaigns.running ?? 0) > 0 ? (
          <span className="text-amber-500 font-medium">{status!.campaigns.running} berjalan</span>
        ) : (
          <span>Idle</span>
        )}
        {(status?.campaigns.scheduled ?? 0) > 0 && (
          <span className="text-blue-500">· {status!.campaigns.scheduled} terjadwal</span>
        )}
      </div>

      <span className="text-[#e8e8e6]">|</span>

      {/* Messages Today */}
      <div className="flex items-center gap-1.5">
        <span className="font-medium text-[#111111]">Hari ini</span>
        <span>{status?.worker.messagesSentToday ?? 0} pesan terkirim</span>
      </div>
    </div>
  )
}
