'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { addContactsToCampaign } from './contact-actions'
import { TagBadge } from '@/components/tag-badge'

interface Contact {
  id: string
  phone: string
  name: string | null
  tags: string[]
  is_blocked: boolean
  opt_out_at: string | null
}

interface Props {
  campaignId: string
  contacts: Contact[]
  existingContactIds: string[]
  allTags: string[]
}

export function ContactSelector({ campaignId, contacts, existingContactIds, allTags }: Props) {
  const router = useRouter()
  const existingSet = useMemo(() => new Set(existingContactIds), [existingContactIds])
  const [search, setSearch] = useState('')
  const [filterTag, setFilterTag] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [isError, setIsError] = useState(false)

  const filtered = useMemo(() => {
    return contacts.filter(c => {
      if (existingSet.has(c.id)) return false
      if (filterStatus === 'aktif' && (c.is_blocked || c.opt_out_at)) return false
      if (filterStatus === 'blocked' && !c.is_blocked) return false
      if (filterStatus === 'optout' && !c.opt_out_at) return false
      if (filterTag && !c.tags.includes(filterTag)) return false
      if (search) {
        const q = search.toLowerCase()
        if (!c.phone.includes(q) && !(c.name?.toLowerCase().includes(q))) return false
      }
      return true
    })
  }, [contacts, existingSet, filterStatus, filterTag, search])

  const allFilteredSelected = filtered.length > 0 && filtered.every(c => selected.has(c.id))

  function toggleAll() {
    if (allFilteredSelected) {
      setSelected(prev => {
        const next = new Set(prev)
        filtered.forEach(c => next.delete(c.id))
        return next
      })
    } else {
      setSelected(prev => {
        const next = new Set(prev)
        filtered.forEach(c => next.add(c.id))
        return next
      })
    }
  }

  function toggleOne(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function handleAdd() {
    if (selected.size === 0) return
    setLoading(true)
    setMessage('')
    const result = await addContactsToCampaign(campaignId, Array.from(selected))
    if (result?.error) {
      setMessage(result.error)
      setIsError(true)
    } else {
      setMessage(`✓ ${result.count} kontak ditambahkan`)
      setIsError(false)
      setSelected(new Set())
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <div>
      <div className="flex items-center gap-2 flex-wrap mb-3">
        <div className="relative">
          <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#a0a0a0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Cari nama / nomor..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="h-9 pl-8 pr-3 rounded-lg border border-[#e8e8e6] bg-white text-[13px] text-[#111111] placeholder-[#a0a0a0] focus:outline-none focus:ring-1 focus:ring-[#111111] w-48"
          />
        </div>

        {allTags.length > 0 && (
          <select
            value={filterTag}
            onChange={e => setFilterTag(e.target.value)}
            className="h-9 px-3 rounded-lg border border-[#e8e8e6] bg-white text-[13px] text-[#111111] focus:outline-none focus:ring-1 focus:ring-[#111111]"
          >
            <option value="">Semua Tags</option>
            {allTags.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        )}

        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="h-9 px-3 rounded-lg border border-[#e8e8e6] bg-white text-[13px] text-[#111111] focus:outline-none focus:ring-1 focus:ring-[#111111]"
        >
          <option value="">Semua Status</option>
          <option value="aktif">Aktif</option>
          <option value="optout">Opt-out</option>
          <option value="blocked">Blocked</option>
        </select>

        <div className="ml-auto flex items-center gap-3">
          {message && (
            <span className={`text-[13px] ${isError ? 'text-red-500' : 'text-[#25D366]'}`}>{message}</span>
          )}
          <button
            onClick={handleAdd}
            disabled={selected.size === 0 || loading}
            className="h-9 px-4 rounded-lg bg-[#111111] text-white text-[13px] font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#333] transition-colors"
          >
            {loading ? 'Menambahkan...' : `Tambahkan ${selected.size > 0 ? selected.size : ''} Kontak`}
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="text-[13px] text-[#a0a0a0] py-4">
          {contacts.length === 0 ? 'Belum ada kontak.' : 'Tidak ada kontak yang cocok dengan filter.'}
        </p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-[#e8e8e6]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#e8e8e6]">
                <th className="px-4 py-3 w-8">
                  <input
                    type="checkbox"
                    checked={allFilteredSelected}
                    onChange={toggleAll}
                    className="rounded"
                  />
                </th>
                <th className="text-left px-4 py-3 text-[12px] font-medium text-[#7a7a7a] uppercase tracking-wider">Nama</th>
                <th className="text-left px-4 py-3 text-[12px] font-medium text-[#7a7a7a] uppercase tracking-wider">Nomor</th>
                <th className="text-left px-4 py-3 text-[12px] font-medium text-[#7a7a7a] uppercase tracking-wider">Tags</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f2f2f0]">
              {filtered.map(c => (
                <tr
                  key={c.id}
                  className="hover:bg-[#f8f8f7] transition-colors cursor-pointer"
                  onClick={() => toggleOne(c.id)}
                >
                  <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selected.has(c.id)}
                      onChange={() => toggleOne(c.id)}
                      className="rounded"
                    />
                  </td>
                  <td className="px-4 py-3 text-[13px] text-[#111111]">{c.name ?? '—'}</td>
                  <td className="px-4 py-3 font-mono text-[13px] text-[#111111]">{c.phone}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 flex-wrap">
                      {c.tags?.map(tag => (
                        <TagBadge key={tag} tag={tag} />
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4 py-2 border-t border-[#f2f2f0] text-[12px] text-[#a0a0a0]">
            Menampilkan {filtered.length} kontak · {selected.size} dipilih
          </div>
        </div>
      )}
    </div>
  )
}
