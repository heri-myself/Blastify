'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export function SendersAutoRefresh({ intervalMs = 15_000 }: { intervalMs?: number }) {
  const router = useRouter()
  useEffect(() => {
    const id = setInterval(() => router.refresh(), intervalMs)
    return () => clearInterval(id)
  }, [router, intervalMs])
  return null
}
