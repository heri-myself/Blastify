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
        <div className="mt-2 p-2 bg-white border rounded">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs text-gray-500">Scan dengan WhatsApp di HP Anda</p>
            <span className={`text-xs font-medium tabular-nums ${countdown <= 15 ? 'text-red-500' : 'text-gray-400'}`}>
              {countdown}s
            </span>
          </div>
          <div className="relative">
            <Image
              src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qr)}`}
              alt="QR Code"
              width={200}
              height={200}
              unoptimized
            />
            {countdown <= 15 && (
              <div className="absolute inset-0 flex items-end justify-center pb-2">
                <div className="w-full mx-1 h-1 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-red-500 transition-all duration-1000"
                    style={{ width: `${(countdown / QR_TTL) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>
          <button onClick={fetchQR} className="mt-1 text-xs text-blue-500 hover:underline w-full text-center">
            Generate ulang
          </button>
        </div>
      )}
      {countdown === 0 && !qr && !loading && (
        <p className="text-xs text-red-500 mt-1">QR expired. Klik Lihat QR lagi.</p>
      )}
    </div>
  )
}
