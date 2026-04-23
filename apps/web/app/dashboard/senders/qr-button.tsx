'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import Image from 'next/image'

const QR_TTL = 60

export function QRButton({ senderId }: { senderId: string }) {
  const [qr, setQr] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [connected, setConnected] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  function startCountdown() {
    setCountdown(QR_TTL)
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!)
          setQr(null)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current) }, [])

  async function fetchQR() {
    setLoading(true)
    const res = await fetch(`/api/senders/${senderId}/qr`)
    const data = await res.json()
    setQr(data.qr)
    setConnected(data.connected)
    setLoading(false)
    if (data.qr) startCountdown()
  }

  if (connected) return <span className="text-xs text-green-600">Terhubung</span>

  return (
    <div>
      <Button variant="outline" size="sm" onClick={fetchQR} disabled={loading}>
        {loading ? 'Loading...' : 'Lihat QR'}
      </Button>
      {qr && (
        <div className="mt-3 w-56 rounded-2xl border border-gray-100 shadow-lg overflow-hidden bg-white">
          {/* Header */}
          <div className="bg-[#25D366] px-3 py-2 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                <path d="M12 0C5.373 0 0 5.373 0 12c0 2.136.561 4.14 1.535 5.878L.057 23.786a.5.5 0 0 0 .614.637l6.057-1.588A11.945 11.945 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.907 0-3.686-.523-5.209-1.433l-.374-.22-3.878 1.017 1.034-3.774-.243-.389A9.96 9.96 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
              </svg>
              <span className="text-white text-xs font-semibold">Scan QR Code</span>
            </div>
            <span className={`text-xs font-bold tabular-nums px-2 py-0.5 rounded-full ${countdown <= 15 ? 'bg-red-500 text-white' : 'bg-white/20 text-white'}`}>
              {countdown}s
            </span>
          </div>

          {/* QR Image */}
          <div className="p-3 relative">
            <div className={`transition-opacity duration-300 ${countdown <= 10 ? 'opacity-40' : 'opacity-100'}`}>
              <Image
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qr)}`}
                alt="QR Code"
                width={200}
                height={200}
                unoptimized
                className="rounded-lg w-full h-auto"
              />
            </div>
            {countdown <= 10 && (
              <div className="absolute inset-3 flex items-center justify-center">
                <div className="bg-white/90 rounded-xl px-3 py-2 text-center shadow">
                  <p className="text-xs font-semibold text-red-500">QR Expired</p>
                  <p className="text-[10px] text-gray-400">Generate ulang</p>
                </div>
              </div>
            )}
          </div>

          {/* Progress bar */}
          <div className="h-1 bg-gray-100">
            <div
              className={`h-full transition-all duration-1000 ${countdown <= 15 ? 'bg-red-400' : 'bg-[#25D366]'}`}
              style={{ width: `${(countdown / QR_TTL) * 100}%` }}
            />
          </div>

          {/* Footer */}
          <div className="px-3 py-2 bg-gray-50 flex items-center justify-between">
            <p className="text-[10px] text-gray-400">Buka WA → Perangkat Tertaut</p>
            <button onClick={fetchQR} className="text-[10px] font-medium text-[#25D366] hover:underline">
              Refresh
            </button>
          </div>
        </div>
      )}
      {countdown === 0 && !qr && !loading && (
        <p className="text-xs text-red-500 mt-1">QR expired. Klik Lihat QR lagi.</p>
      )}
    </div>
  )
}
