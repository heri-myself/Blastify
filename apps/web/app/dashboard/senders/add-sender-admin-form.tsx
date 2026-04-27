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
    <div className="bg-white rounded-xl border border-[#e8e8e6] p-5 mb-5">
      <p className="text-[13px] font-medium text-[#111111] mb-3">Tambah Nomor Sender</p>
      <form onSubmit={handleSubmit} className="flex gap-2.5 flex-wrap items-start">
        <select
          name="target_user_id"
          required
          className="h-9 px-3 rounded-lg border border-[#e8e8e6] bg-[#f8f8f7] text-[13px] text-[#111111] outline-none focus:border-[#111111] transition-colors"
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
          className="h-9 px-3 rounded-lg border border-[#e8e8e6] bg-[#f8f8f7] text-[13px] font-mono placeholder:text-[#b0b0b0] outline-none focus:border-[#111111] transition-colors w-48"
        />
        <input
          name="display_name"
          placeholder="Nama (opsional)"
          className="h-9 px-3 rounded-lg border border-[#e8e8e6] bg-[#f8f8f7] text-[13px] placeholder:text-[#b0b0b0] outline-none focus:border-[#111111] transition-colors w-44"
        />
        <button
          type="submit"
          disabled={loading}
          className="h-9 px-4 rounded-lg bg-[#111111] text-white text-[13px] font-medium hover:bg-[#2a2a2a] disabled:opacity-50 transition-colors"
        >
          {loading ? 'Menyimpan...' : 'Tambah'}
        </button>
      </form>
      {error && <p className="text-[12px] text-red-500 mt-2">{error}</p>}
      {success && <p className="text-[12px] text-[#25D366] mt-2">Sender berhasil ditambahkan.</p>}
      <p className="text-[12px] text-[#a0a0a0] mt-2">Format: 628xxxxxxxxxx · Nomor baru otomatis masuk mode warm-up.</p>
    </div>
  )
}
