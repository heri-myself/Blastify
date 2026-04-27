'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { toggleUserActive, deleteUser } from './actions'

export function UserActions({ userId, isActive }: { userId: string; isActive: boolean }) {
  const [loading, setLoading] = useState(false)

  async function handleToggle() {
    setLoading(true)
    await toggleUserActive(userId, !isActive)
    setLoading(false)
  }

  async function handleDelete() {
    if (!confirm('Hapus user ini? Semua data mereka akan ikut terhapus.')) return
    setLoading(true)
    await deleteUser(userId)
    setLoading(false)
  }

  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={handleToggle} disabled={loading}>
        {isActive ? 'Nonaktifkan' : 'Aktifkan'}
      </Button>
      <Button variant="destructive" size="sm" onClick={handleDelete} disabled={loading}>
        Hapus
      </Button>
    </div>
  )
}
