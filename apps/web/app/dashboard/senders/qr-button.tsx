'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import Image from 'next/image'

export function QRButton({ senderId }: { senderId: string }) {
  const [qr, setQr] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [connected, setConnected] = useState(false)

  async function fetchQR() {
    setLoading(true)
    const res = await fetch(`/api/senders/${senderId}/qr`)
    const data = await res.json()
    setQr(data.qr)
    setConnected(data.connected)
    setLoading(false)
  }

  if (connected) return <span className="text-xs text-green-600">Terhubung</span>

  return (
    <div>
      <Button variant="outline" size="sm" onClick={fetchQR} disabled={loading}>
        {loading ? 'Loading...' : 'Lihat QR'}
      </Button>
      {qr && (
        <div className="mt-2 p-2 bg-white border rounded">
          <p className="text-xs text-gray-500 mb-1">Scan dengan WhatsApp di HP Anda</p>
          <Image
            src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qr)}`}
            alt="QR Code"
            width={200}
            height={200}
            unoptimized
          />
        </div>
      )}
    </div>
  )
}
