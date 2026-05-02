'use client'

import { useState } from 'react'
import { addSenderForUser } from './actions'

export function AddSenderAdminForm({ users }: { users: { id: string; email: string }[] }) {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)
    const result = await addSenderForUser(new FormData(e.currentTarget))
    setLoading(false)
    if (result?.error) {
      setError(result.error)
    } else {
      setSuccess(true)
      ;(e.target as HTMLFormElement).reset()
    }
  }

  return (
    <div className="bg-card rounded-xl border border-border p-5 mb-5">
      <p className="text-[13px] font-medium text-foreground mb-3">Tambah Nomor Sender</p>
      <form onSubmit={handleSubmit} className="flex gap-2.5 flex-wrap items-start">
        <select
          name="target_user_id"
          required
          className="h-9 px-3 rounded-lg border border-border bg-background text-[13px] text-foreground outline-none focus:border-accent transition-colors"
        >
          <option value="">Pilih user...</option>
          {users.map(u => (
            <option key={u.id} value={u.id}>{u.email}</option>
          ))}
        </select>
        <input
          name="phone_number"
          placeholder="628xxxxxxxxxx"
          required
          className="h-9 px-3 rounded-lg border border-border bg-background text-[13px] font-mono placeholder:text-muted-foreground outline-none focus:border-accent transition-colors w-48"
        />
        <input
          name="display_name"
          placeholder="Nama (opsional)"
          className="h-9 px-3 rounded-lg border border-border bg-background text-[13px] placeholder:text-muted-foreground outline-none focus:border-accent transition-colors w-44"
        />
        <button
          type="submit"
          disabled={loading}
          className="h-9 px-4 rounded-lg bg-foreground text-background hover:opacity-90 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Menyimpan...' : 'Tambah'}
        </button>
      </form>
      {error && <p className="text-[12px] text-red-500 mt-2">{error}</p>}
      {success && <p className="text-[12px] text-[#25D366] mt-2">Sender berhasil ditambahkan.</p>}
      <p className="text-[12px] text-muted-foreground mt-2">Format: 628xxxxxxxxxx · Nomor baru otomatis masuk mode warm-up.</p>
    </div>
  )
}
