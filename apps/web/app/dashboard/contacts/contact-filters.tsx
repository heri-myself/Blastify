'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useCallback } from 'react'

interface ContactFiltersProps {
  users?: Array<{ id: string; email: string }>
  isSuperadmin: boolean
  allTags?: string[]
}

export function ContactFilters({ users, isSuperadmin, allTags }: ContactFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const setParam = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set(key, value)
    else params.delete(key)
    params.delete('page')
    router.push(`${pathname}?${params.toString()}`)
  }, [router, pathname, searchParams])

  return (
    <div className="flex items-center gap-2 flex-wrap mb-4">
      <div className="relative">
        <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#a0a0a0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder="Cari nama / nomor..."
          defaultValue={searchParams.get('q') ?? ''}
          onChange={e => setParam('q', e.target.value)}
          className="h-9 pl-8 pr-3 rounded-lg border border-[#e8e8e6] bg-white text-[13px] text-[#111111] placeholder-[#a0a0a0] focus:outline-none focus:ring-1 focus:ring-[#111111] w-52"
        />
      </div>

      <select
        defaultValue={searchParams.get('status') ?? ''}
        onChange={e => setParam('status', e.target.value)}
        className="h-9 px-3 rounded-lg border border-[#e8e8e6] bg-white text-[13px] text-[#111111] focus:outline-none focus:ring-1 focus:ring-[#111111]"
      >
        <option value="">Semua Status</option>
        <option value="aktif">Aktif</option>
        <option value="optout">Opt-out</option>
        <option value="blocked">Blocked</option>
      </select>

      {allTags && allTags.length > 0 && (
        <select
          defaultValue={searchParams.get('tag') ?? ''}
          onChange={e => setParam('tag', e.target.value)}
          className="h-9 px-3 rounded-lg border border-[#e8e8e6] bg-white text-[13px] text-[#111111] focus:outline-none focus:ring-1 focus:ring-[#111111] max-w-[180px]"
        >
          <option value="">Semua Tags</option>
          {allTags.map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      )}

      {isSuperadmin && users && users.length > 0 && (
        <select
          defaultValue={searchParams.get('user') ?? ''}
          onChange={e => setParam('user', e.target.value)}
          className="h-9 px-3 rounded-lg border border-[#e8e8e6] bg-white text-[13px] text-[#111111] focus:outline-none focus:ring-1 focus:ring-[#111111] max-w-[200px]"
        >
          <option value="">Semua User</option>
          {users.map(u => (
            <option key={u.id} value={u.id}>{u.email}</option>
          ))}
        </select>
      )}

      {(searchParams.get('q') || searchParams.get('status') || searchParams.get('user') || searchParams.get('tag')) && (
        <button
          onClick={() => router.push(pathname)}
          className="h-9 px-3 rounded-lg border border-[#e8e8e6] bg-white text-[13px] text-[#7a7a7a] hover:text-[#111111] transition-colors"
        >
          Reset
        </button>
      )}
    </div>
  )
}
