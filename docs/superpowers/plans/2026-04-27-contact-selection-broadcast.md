# Contact Selection & Broadcast Status Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ganti auto-assign kontak dengan pemilihan manual di detail campaign, tampilkan status broadcast per kontak, dan tambah badge riwayat broadcast di halaman kontak.

**Architecture:** Form buat campaign dihapus auto-assign-nya; detail campaign mendapat dua client/server component baru (daftar kontak terdaftar + selector kontak); halaman kontak menambah badge hover-tooltip dari join ke `campaign_contacts`.

**Tech Stack:** Next.js App Router, Supabase (admin client), React client components, TypeScript, Tailwind CSS

---

## File Map

| File | Action | Tanggung Jawab |
|------|--------|----------------|
| `apps/web/app/dashboard/campaigns/actions.ts` | Modify | Hapus auto-assign dari `createCampaign` |
| `apps/web/app/dashboard/campaigns/new/page.tsx` | Modify | Hapus field filter_tags |
| `apps/web/app/dashboard/campaigns/[id]/contact-actions.ts` | Create | Server actions: add/remove/retry/removePending |
| `apps/web/app/dashboard/campaigns/[id]/campaign-contact-list.tsx` | Create | Tabel kontak terdaftar + hapus + retry |
| `apps/web/app/dashboard/campaigns/[id]/contact-selector.tsx` | Create | Client component filter + checkbox + bulk add |
| `apps/web/app/dashboard/campaigns/[id]/page.tsx` | Modify | Render dua section baru |
| `apps/web/app/dashboard/contacts/page.tsx` | Modify | Tambah broadcast badge dengan tooltip |

---

### Task 1: Hapus auto-assign dari `createCampaign`

**Files:**
- Modify: `apps/web/app/dashboard/campaigns/actions.ts`

- [ ] **Step 1: Hapus blok auto-assign kontak dari `createCampaign`**

Buka `apps/web/app/dashboard/campaigns/actions.ts`. Hapus seluruh blok berikut (dari baris `let query = supabase` sampai `await supabase.from('campaign_contacts').insert(contactRows)`):

```typescript
// HAPUS blok ini:
  let query = supabase
    .from('contacts')
    .select('id')
    .eq('user_id', user.id)
    .eq('is_blocked', false)
    .is('opt_out_at', null)

  if (filterTags) {
    const tags = filterTags.split(',').map(t => t.trim()).filter(Boolean)
    if (tags.length > 0) query = query.overlaps('tags', tags)
  }

  const { data: contacts } = await query

  if (contacts && contacts.length > 0) {
    const contactRows = contacts.map(c => ({
      campaign_id: campaign.id,
      contact_id: c.id,
      status: 'pending' as const,
    }))
    await supabase.from('campaign_contacts').insert(contactRows)
  }
```

Sisa `createCampaign` setelah hapus (bagian akhir fungsi):
```typescript
  revalidatePath('/dashboard/campaigns')
  redirect(`/dashboard/campaigns/${campaign.id}`)
```

- [ ] **Step 2: Hapus variabel `filterTags` yang tidak lagi dipakai di `createCampaign`**

Hapus baris:
```typescript
  const filterTags = formData.get('filter_tags') as string
```

Dan hapus `target_filter` dari insert campaigns:
```typescript
// SEBELUM:
      target_filter: filterTags
        ? { tags: filterTags.split(',').map(t => t.trim()).filter(Boolean) }
        : null,

// SESUDAH: hapus baris target_filter sepenuhnya (atau set null):
      target_filter: null,
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/app/dashboard/campaigns/actions.ts
git commit -m "refactor: remove auto-assign contacts from createCampaign"
```

---

### Task 2: Hapus field filter_tags dari form buat campaign

**Files:**
- Modify: `apps/web/app/dashboard/campaigns/new/page.tsx`

- [ ] **Step 1: Hapus div filter_tags dari form**

Hapus blok ini dari JSX:
```tsx
        <div className="space-y-2">
          <Label htmlFor="filter_tags">Filter Tag Kontak (opsional)</Label>
          <Input id="filter_tags" name="filter_tags" placeholder="pelanggan,vip (pisah koma)" />
          <p className="text-xs text-gray-400">Kosongkan untuk kirim ke semua kontak aktif</p>
        </div>
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/app/dashboard/campaigns/new/page.tsx
git commit -m "refactor: remove filter_tags field from new campaign form"
```

---

### Task 3: Buat server actions untuk kelola kontak campaign

**Files:**
- Create: `apps/web/app/dashboard/campaigns/[id]/contact-actions.ts`

- [ ] **Step 1: Buat file `contact-actions.ts`**

```typescript
'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { getUserRole } from '@/lib/get-user-role'

async function verifyCampaignOwnership(campaignId: string, userId: string) {
  const admin = createAdminClient()
  const { data } = await admin
    .from('campaigns')
    .select('id')
    .eq('id', campaignId)
    .eq('user_id', userId)
    .single()
  return !!data
}

export async function addContactsToCampaign(campaignId: string, contactIds: string[]) {
  const profile = await getUserRole()
  if (!profile) return { error: 'Unauthorized' }

  const owned = await verifyCampaignOwnership(campaignId, profile.userId)
  if (!owned) return { error: 'Campaign tidak ditemukan' }

  const admin = createAdminClient()

  // Ambil contact_id yang sudah ada agar tidak duplikat
  const { data: existing } = await admin
    .from('campaign_contacts')
    .select('contact_id')
    .eq('campaign_id', campaignId)

  const existingIds = new Set((existing ?? []).map(r => r.contact_id))
  const newIds = contactIds.filter(id => !existingIds.has(id))

  if (newIds.length === 0) return { error: 'Semua kontak sudah ada di campaign ini', count: 0 }

  const rows = newIds.map(contact_id => ({
    campaign_id: campaignId,
    contact_id,
    status: 'pending' as const,
  }))

  const { error } = await admin.from('campaign_contacts').insert(rows)
  if (error) return { error: error.message }

  revalidatePath(`/dashboard/campaigns/${campaignId}`)
  return { success: true, count: newIds.length }
}

export async function removeContactFromCampaign(campaignContactId: string, campaignId: string) {
  const profile = await getUserRole()
  if (!profile) return { error: 'Unauthorized' }

  const owned = await verifyCampaignOwnership(campaignId, profile.userId)
  if (!owned) return { error: 'Campaign tidak ditemukan' }

  const admin = createAdminClient()
  const { error } = await admin
    .from('campaign_contacts')
    .delete()
    .eq('id', campaignContactId)
    .eq('status', 'pending')

  if (error) return { error: error.message }
  revalidatePath(`/dashboard/campaigns/${campaignId}`)
  return { success: true }
}

export async function retryContactBroadcast(campaignContactId: string, campaignId: string) {
  const profile = await getUserRole()
  if (!profile) return { error: 'Unauthorized' }

  const owned = await verifyCampaignOwnership(campaignId, profile.userId)
  if (!owned) return { error: 'Campaign tidak ditemukan' }

  const admin = createAdminClient()
  const { error } = await admin
    .from('campaign_contacts')
    .update({ status: 'pending', error_code: null, retry_count: 0 })
    .eq('id', campaignContactId)
    .eq('status', 'failed')

  if (error) return { error: error.message }
  revalidatePath(`/dashboard/campaigns/${campaignId}`)
  return { success: true }
}

export async function removePendingContacts(campaignId: string) {
  const profile = await getUserRole()
  if (!profile) return { error: 'Unauthorized' }

  const owned = await verifyCampaignOwnership(campaignId, profile.userId)
  if (!owned) return { error: 'Campaign tidak ditemukan' }

  const admin = createAdminClient()
  const { error } = await admin
    .from('campaign_contacts')
    .delete()
    .eq('campaign_id', campaignId)
    .eq('status', 'pending')

  if (error) return { error: error.message }
  revalidatePath(`/dashboard/campaigns/${campaignId}`)
  return { success: true }
}
```

- [ ] **Step 2: Commit**

```bash
git add "apps/web/app/dashboard/campaigns/[id]/contact-actions.ts"
git commit -m "feat: add contact-actions server actions for campaign contact management"
```

---

### Task 4: Buat `campaign-contact-list.tsx` — daftar kontak terdaftar

**Files:**
- Create: `apps/web/app/dashboard/campaigns/[id]/campaign-contact-list.tsx`

- [ ] **Step 1: Buat component**

```tsx
import { removeContactFromCampaign, retryContactBroadcast, removePendingContacts } from './contact-actions'

interface CampaignContact {
  id: string
  contact_id: string
  status: string
  sent_at: string | null
  error_code: string | null
  contacts: { name: string | null; phone: string } | null
}

interface Props {
  campaignId: string
  campaignContacts: CampaignContact[]
}

const statusBadge: Record<string, string> = {
  pending:   'bg-[#f2f2f0] text-[#7a7a7a]',
  sending:   'bg-blue-50 text-blue-600',
  sent:      'bg-blue-50 text-blue-600',
  delivered: 'bg-[#f0fdf4] text-[#25D366]',
  failed:    'bg-red-50 text-red-500',
  skipped:   'bg-orange-50 text-orange-500',
}

const statusLabel: Record<string, string> = {
  pending:   'Pending',
  sending:   'Mengirim',
  sent:      'Terkirim',
  delivered: 'Delivered',
  failed:    'Gagal',
  skipped:   'Dilewati',
}

export function CampaignContactList({ campaignId, campaignContacts }: Props) {
  const pendingCount = campaignContacts.filter(c => c.status === 'pending').length

  if (campaignContacts.length === 0) {
    return (
      <p className="text-[13px] text-[#a0a0a0] py-4">
        Belum ada kontak. Tambah kontak di bawah.
      </p>
    )
  }

  return (
    <div>
      {pendingCount > 0 && (
        <div className="flex justify-end mb-3">
          <form action={async () => {
            'use server'
            await removePendingContacts(campaignId)
          }}>
            <button
              type="submit"
              className="text-[12px] text-red-500 hover:text-red-700 transition-colors"
            >
              Hapus Semua Pending ({pendingCount})
            </button>
          </form>
        </div>
      )}
      <div className="overflow-hidden rounded-xl border border-[#e8e8e6]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#e8e8e6]">
              <th className="text-left px-4 py-3 text-[12px] font-medium text-[#7a7a7a] uppercase tracking-wider">Nama</th>
              <th className="text-left px-4 py-3 text-[12px] font-medium text-[#7a7a7a] uppercase tracking-wider">Nomor</th>
              <th className="text-left px-4 py-3 text-[12px] font-medium text-[#7a7a7a] uppercase tracking-wider">Status</th>
              <th className="text-left px-4 py-3 text-[12px] font-medium text-[#7a7a7a] uppercase tracking-wider">Waktu Kirim</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f2f2f0]">
            {campaignContacts.map(cc => (
              <tr key={cc.id} className="hover:bg-[#f8f8f7] transition-colors">
                <td className="px-4 py-3 text-[13px] text-[#111111]">{cc.contacts?.name ?? '—'}</td>
                <td className="px-4 py-3 font-mono text-[13px] text-[#111111]">{cc.contacts?.phone ?? '—'}</td>
                <td className="px-4 py-3">
                  <span className={`text-[12px] px-2.5 py-1 rounded-full font-medium ${statusBadge[cc.status] ?? statusBadge.pending}`}>
                    {statusLabel[cc.status] ?? cc.status}
                  </span>
                  {cc.error_code && (
                    <span className="ml-2 text-[11px] text-red-400">{cc.error_code}</span>
                  )}
                </td>
                <td className="px-4 py-3 text-[13px] text-[#7a7a7a]">
                  {cc.sent_at ? new Date(cc.sent_at).toLocaleString('id-ID') : '—'}
                </td>
                <td className="px-4 py-3 text-right">
                  {cc.status === 'pending' && (
                    <form action={async () => {
                      'use server'
                      await removeContactFromCampaign(cc.id, campaignId)
                    }}>
                      <button type="submit" className="text-[13px] text-[#a0a0a0] hover:text-red-500 transition-colors font-medium">
                        Hapus
                      </button>
                    </form>
                  )}
                  {cc.status === 'failed' && (
                    <form action={async () => {
                      'use server'
                      await retryContactBroadcast(cc.id, campaignId)
                    }}>
                      <button type="submit" className="text-[13px] text-[#a0a0a0] hover:text-blue-500 transition-colors font-medium">
                        Retry
                      </button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add "apps/web/app/dashboard/campaigns/[id]/campaign-contact-list.tsx"
git commit -m "feat: add CampaignContactList component"
```

---

### Task 5: Buat `contact-selector.tsx` — pilih kontak client component

**Files:**
- Create: `apps/web/app/dashboard/campaigns/[id]/contact-selector.tsx`

- [ ] **Step 1: Buat component**

```tsx
'use client'

import { useState, useMemo } from 'react'
import { addContactsToCampaign } from './contact-actions'

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
  existingContactIds: Set<string>
  allTags: string[]
}

export function ContactSelector({ campaignId, contacts, existingContactIds, allTags }: Props) {
  const [search, setSearch] = useState('')
  const [filterTag, setFilterTag] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [isError, setIsError] = useState(false)

  const filtered = useMemo(() => {
    return contacts.filter(c => {
      if (existingContactIds.has(c.id)) return false
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
  }, [contacts, existingContactIds, filterStatus, filterTag, search])

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
                        <span key={tag} className="text-[11px] px-2 py-0.5 rounded-full bg-[#f2f2f0] text-[#7a7a7a] font-medium">
                          {tag}
                        </span>
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
```

- [ ] **Step 2: Commit**

```bash
git add "apps/web/app/dashboard/campaigns/[id]/contact-selector.tsx"
git commit -m "feat: add ContactSelector client component"
```

---

### Task 6: Update halaman detail campaign

**Files:**
- Modify: `apps/web/app/dashboard/campaigns/[id]/page.tsx`

- [ ] **Step 1: Update query dan import**

Ganti seluruh isi `page.tsx` dengan:

```tsx
import { createAdminClient } from '@/lib/supabase/admin'
import { pauseCampaign, resumeCampaign } from '../actions'
import { Button } from '@/components/ui/button'
import { notFound } from 'next/navigation'
import { EditMessageForm } from './edit-message-form'
import { DeleteCampaignButton } from './delete-campaign-button'
import { CampaignContactList } from './campaign-contact-list'
import { ContactSelector } from './contact-selector'
import { getUserRole } from '@/lib/get-user-role'

export default async function CampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const admin = createAdminClient()
  const profile = await getUserRole()

  const [{ data: campaign }, { data: campaignContacts }, { data: allContacts }] = await Promise.all([
    admin.from('campaigns').select('*, campaign_messages(*)').eq('id', id).single(),
    admin
      .from('campaign_contacts')
      .select('id, contact_id, status, sent_at, error_code, contacts(name, phone)')
      .eq('campaign_id', id)
      .order('created_at', { ascending: true }),
    admin
      .from('contacts')
      .select('id, phone, name, tags, is_blocked, opt_out_at')
      .eq('user_id', profile!.userId)
      .order('name', { ascending: true }),
  ])

  if (!campaign) notFound()

  const counts = {
    total: campaignContacts?.length ?? 0,
    pending: campaignContacts?.filter(s => s.status === 'pending').length ?? 0,
    sent: campaignContacts?.filter(s => s.status === 'sent').length ?? 0,
    delivered: campaignContacts?.filter(s => s.status === 'delivered').length ?? 0,
    failed: campaignContacts?.filter(s => s.status === 'failed').length ?? 0,
    skipped: campaignContacts?.filter(s => s.status === 'skipped').length ?? 0,
  }

  const successRate = counts.total > 0
    ? Math.round((counts.delivered / counts.total) * 100)
    : 0

  const existingContactIds = new Set((campaignContacts ?? []).map(cc => cc.contact_id))
  const allTags = Array.from(new Set((allContacts ?? []).flatMap(c => c.tags ?? []))).sort()

  const statusStyle: Record<string, string> = {
    draft: 'bg-[#f2f2f0] text-[#7a7a7a]', scheduled: 'bg-blue-50 text-blue-600',
    running: 'bg-amber-50 text-amber-600', paused: 'bg-orange-50 text-orange-500',
    done: 'bg-[#f0fdf4] text-[#25D366]', failed: 'bg-red-50 text-red-500',
  }
  const statusLabel: Record<string, string> = {
    draft: 'Draft', scheduled: 'Terjadwal', running: 'Berjalan',
    paused: 'Dijeda', done: 'Selesai', failed: 'Gagal',
  }

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-[#111111]">{campaign.name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-[12px] px-2.5 py-1 rounded-full font-medium ${statusStyle[campaign.status]}`}>
              {statusLabel[campaign.status]}
            </span>
            {campaign.scheduled_at && (
              <span className="text-[13px] text-[#7a7a7a] font-mono">
                {new Date(campaign.scheduled_at).toLocaleString('id-ID')}
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          {campaign.status === 'running' && (
            <form action={async () => { 'use server'; await pauseCampaign(id) }}>
              <Button variant="outline" type="submit">Pause</Button>
            </form>
          )}
          {campaign.status === 'paused' && (
            <form action={async () => { 'use server'; await resumeCampaign(id) }}>
              <Button type="submit">Lanjutkan</Button>
            </form>
          )}
          <DeleteCampaignButton campaignId={id} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total Kontak', value: counts.total },
          { label: 'Terkirim', value: counts.sent },
          { label: 'Delivered', value: counts.delivered },
          { label: 'Gagal', value: counts.failed },
          { label: 'Dilewati', value: counts.skipped },
          { label: 'Success Rate', value: `${successRate}%` },
        ].map(stat => (
          <div key={stat.label} className="bg-white rounded-xl border border-[#e8e8e6] p-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-[#25D366]" />
            <p className="text-[12px] font-medium text-[#7a7a7a] uppercase tracking-wider">{stat.label}</p>
            <p className="text-2xl font-bold text-[#111111] mt-1 tabular-nums">{stat.value}</p>
          </div>
        ))}
      </div>

      {campaign.campaign_messages?.[0] && (
        <div className="bg-white rounded-xl border border-[#e8e8e6] p-5 mb-6">
          <EditMessageForm
            messageId={campaign.campaign_messages[0].id}
            campaignId={id}
            initialContent={campaign.campaign_messages[0].content ?? ''}
          />
        </div>
      )}

      {/* Kontak Terdaftar */}
      <div className="bg-white rounded-xl border border-[#e8e8e6] p-5 mb-4">
        <h2 className="text-[14px] font-semibold text-[#111111] mb-4">
          Kontak Terdaftar
          {counts.total > 0 && (
            <span className="ml-2 text-[12px] font-normal text-[#7a7a7a]">({counts.total})</span>
          )}
        </h2>
        <CampaignContactList
          campaignId={id}
          campaignContacts={(campaignContacts ?? []) as any}
        />
      </div>

      {/* Tambah Kontak */}
      <div className="bg-white rounded-xl border border-[#e8e8e6] p-5">
        <h2 className="text-[14px] font-semibold text-[#111111] mb-4">Tambah Kontak</h2>
        <ContactSelector
          campaignId={id}
          contacts={allContacts ?? []}
          existingContactIds={existingContactIds}
          allTags={allTags}
        />
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add "apps/web/app/dashboard/campaigns/[id]/page.tsx"
git commit -m "feat: add contact management sections to campaign detail page"
```

---

### Task 7: Tambah broadcast badge di halaman kontak

**Files:**
- Modify: `apps/web/app/dashboard/contacts/page.tsx`

- [ ] **Step 1: Tambah query broadcast history**

Setelah `const { data: contacts } = await query` dan sebelum blok `allTags`, tambahkan:

```typescript
  // Ambil entry campaign_contacts terbaru per contact_id untuk badge broadcast
  let broadcastMap: Record<string, { campaignName: string; status: string }> = {}
  if (contacts && contacts.length > 0) {
    const contactIds = contacts.map(c => c.id)
    const { data: broadcastData } = await admin
      .from('campaign_contacts')
      .select('contact_id, status, campaigns(name)')
      .in('contact_id', contactIds)
      .order('created_at', { ascending: false })

    if (broadcastData) {
      for (const row of broadcastData) {
        if (!broadcastMap[row.contact_id]) {
          broadcastMap[row.contact_id] = {
            campaignName: (row.campaigns as any)?.name ?? '—',
            status: row.status,
          }
        }
      }
    }
  }
```

- [ ] **Step 2: Tambah badge di kolom Status pada tabel**

Ubah kolom status di `<td>` dari:
```tsx
                <td className="px-4 py-3">
                  {contact.is_blocked ? (
                    <span className="text-[12px] px-2.5 py-1 rounded-full bg-red-50 text-red-500 font-medium">Blocked</span>
                  ) : contact.opt_out_at ? (
                    <span className="text-[12px] px-2.5 py-1 rounded-full bg-[#f2f2f0] text-[#7a7a7a] font-medium">Opt-out</span>
                  ) : (
                    <span className="text-[12px] px-2.5 py-1 rounded-full bg-[#f0fdf4] text-[#25D366] font-medium">Aktif</span>
                  )}
                </td>
```

Menjadi:
```tsx
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {contact.is_blocked ? (
                      <span className="text-[12px] px-2.5 py-1 rounded-full bg-red-50 text-red-500 font-medium">Blocked</span>
                    ) : contact.opt_out_at ? (
                      <span className="text-[12px] px-2.5 py-1 rounded-full bg-[#f2f2f0] text-[#7a7a7a] font-medium">Opt-out</span>
                    ) : (
                      <span className="text-[12px] px-2.5 py-1 rounded-full bg-[#f0fdf4] text-[#25D366] font-medium">Aktif</span>
                    )}
                    {broadcastMap[contact.id] && (
                      <span
                        title={`Terakhir: ${broadcastMap[contact.id].campaignName} · ${broadcastMap[contact.id].status}`}
                        className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#f0fdf4] text-[#25D366] cursor-default text-[11px] font-bold"
                      >
                        ✓
                      </span>
                    )}
                  </div>
                </td>
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/app/dashboard/contacts/page.tsx
git commit -m "feat: add broadcast history badge to contacts page"
```

---

### Task 8: Push dan verifikasi

- [ ] **Step 1: Push ke Vercel**

```bash
git push
```

- [ ] **Step 2: Verifikasi di production**

1. Buka `/dashboard/campaigns/new` → pastikan tidak ada field "Filter Tag Kontak"
2. Buat campaign baru → campaign dibuat tanpa kontak, redirect ke detail
3. Di detail campaign, section "Tambah Kontak" muncul dengan filter + checkbox
4. Centang beberapa kontak → klik "Tambahkan" → muncul di "Kontak Terdaftar"
5. Hapus kontak pending → hilang dari daftar
6. Buka `/dashboard/contacts` → kontak yang pernah di-broadcast tampil badge `✓`
7. Hover badge → tooltip muncul dengan nama campaign dan status
