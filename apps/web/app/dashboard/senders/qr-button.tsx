'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import Image from 'next/image'

const QR_TTL = 55        // detik sebelum anggap expired (WA expire ~60s)
const POLL_INTERVAL = 3  // detik interval polling saat QR null

export function QRButton({ senderId }: { senderId: string }) {
  const [open, setOpen] = useState(false)
  const [qr, setQr] = useState<string | null>(null)
  const [connected, setConnected] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [polling, setPolling] = useState(false)

  const countdownRef = useRef<NodeJS.Timeout | null>(null)
  const pollRef = useRef<NodeJS.Timeout | null>(null)

  const stopCountdown = () => {
    if (countdownRef.current) clearInterval(countdownRef.current)
  }
  const stopPoll = () => {
    if (pollRef.current) clearInterval(pollRef.current)
    setPolling(false)
  }

  useEffect(() => () => { stopCountdown(); stopPoll() }, [])

  const startCountdown = useCallback(() => {
    stopCountdown()
    setCountdown(QR_TTL)
    countdownRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownRef.current!)
          // QR expired — langsung fetch ulang otomatis
          setQr(null)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }, [])

  const fetchQR = useCallback(async () => {
    try {
      const res = await fetch(`/api/senders/${senderId}/qr`, { cache: 'no-store' })
      const data = await res.json()

      if (data.connected) {
        setConnected(true)
        setQr(null)
        stopPoll()
        stopCountdown()
        return
      }

      if (data.qr) {
        setQr(data.qr)
        stopPoll()
        setPolling(false)
        startCountdown()
      }
      // Jika qr masih null, polling lanjut
    } catch {}
  }, [senderId, startCountdown])

  // Auto-fetch ulang saat QR null dan panel terbuka
  useEffect(() => {
    if (!open || connected) return
    if (qr) return // Sudah ada QR, tidak perlu poll

    setPolling(true)
    fetchQR() // fetch langsung
    pollRef.current = setInterval(fetchQR, POLL_INTERVAL * 1000)
    return () => stopPoll()
  }, [open, qr, connected, fetchQR])

  // Saat QR expire (countdown = 0), mulai poll lagi
  useEffect(() => {
    if (open && countdown === 0 && !qr && !connected) {
      setPolling(true)
      fetchQR()
      pollRef.current = setInterval(fetchQR, POLL_INTERVAL * 1000)
      return () => stopPoll()
    }
  }, [countdown, open, qr, connected, fetchQR])

  function handleOpen() {
    setOpen(true)
    setQr(null)
    setCountdown(0)
    setConnected(false)
  }

  function handleClose() {
    setOpen(false)
    stopPoll()
    stopCountdown()
    setQr(null)
    setCountdown(0)
  }

  if (connected) return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 border border-green-200 px-2 py-1 rounded-full">
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
      </svg>
      Terhubung
    </span>
  )

  return (
    <div className="flex flex-col items-end gap-1">
      <Button variant="outline" size="sm" onClick={handleOpen} className="h-7 text-xs px-3 gap-1.5">
        <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
          <rect x="3" y="14" width="7" height="7"/><path d="M14 14h3v3M17 14v3h3M14 17h3"/>
        </svg>
        Lihat QR
      </Button>

      {open && (
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
            <div className="flex items-center gap-1.5">
              {qr && (
                <span className={`text-xs font-bold tabular-nums px-2 py-0.5 rounded-full ${countdown <= 15 ? 'bg-red-500 text-white' : 'bg-white/20 text-white'}`}>
                  {countdown}s
                </span>
              )}
              <button onClick={handleClose} className="text-white/70 hover:text-white transition-colors ml-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
          </div>

          {/* QR Area */}
          <div className="p-3">
            {qr ? (
              <div className="relative">
                <div className={`transition-opacity duration-300 ${countdown <= 10 ? 'opacity-30' : 'opacity-100'}`}>
                  <Image src={qr} alt="QR Code" width={200} height={200} unoptimized className="rounded-lg w-full h-auto" />
                </div>
                {countdown <= 10 && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-white/95 rounded-xl px-3 py-2 text-center shadow">
                      <svg className="w-4 h-4 animate-spin text-[#25D366] mx-auto mb-1" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                      </svg>
                      <p className="text-xs font-semibold text-[#111]">Memperbarui QR...</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-[200px] flex flex-col items-center justify-center gap-2">
                <svg className="w-6 h-6 animate-spin text-[#25D366]" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                </svg>
                <p className="text-[11px] text-[#a0a0a0]">Menunggu QR...</p>
                <p className="text-[10px] text-[#c0c0c0]">refresh otomatis tiap {POLL_INTERVAL}s</p>
              </div>
            )}
          </div>

          {/* Progress bar */}
          {qr && (
            <div className="h-1 bg-gray-100">
              <div
                className={`h-full transition-all duration-1000 ${countdown <= 15 ? 'bg-red-400' : 'bg-[#25D366]'}`}
                style={{ width: `${(countdown / QR_TTL) * 100}%` }}
              />
            </div>
          )}

          {/* Footer */}
          <div className="px-3 py-2 bg-gray-50">
            <p className="text-[10px] text-gray-400">Buka WA → Perangkat Tertaut → Tautkan Perangkat</p>
          </div>
        </div>
      )}
    </div>
  )
}
