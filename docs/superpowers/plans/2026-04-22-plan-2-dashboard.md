# WA Broadcast Tools — Plan 2: Web Dashboard

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bangun semua halaman dashboard: manajemen kontak (import CSV), upload media, buat campaign, kelola sender WA, dan overview statistik.

**Architecture:** Next.js App Router dengan Server Components untuk data fetching, Server Actions untuk mutations, Supabase Realtime untuk update live. Setiap fitur di route-nya sendiri dengan komponen yang terfokus.

**Tech Stack:** Next.js 16, shadcn/ui, Tailwind CSS, Supabase JS v2, @supabase/ssr, papaparse (CSV parsing)

**Prerequisite:** Plan 1 sudah selesai dan verified.

---

## File Structure

```
apps/web/
├── app/
│   └── dashboard/
│       ├── layout.tsx              # sudah ada dari Plan 1 — tambah sidebar
│       ├── page.tsx                # overview stats
│       ├── contacts/
│       │   ├── page.tsx            # list kontak
│       │   ├── actions.ts          # server actions: create, import, delete
│       │   └── import-form.tsx     # client component upload CSV
│       ├── media/
│       │   ├── page.tsx            # grid media files
│       │   ├── actions.ts          # server actions: upload, delete
│       │   └── upload-form.tsx     # client component drag & drop
│       ├── campaigns/
│       │   ├── page.tsx            # list campaigns
│       │   ├── new/page.tsx        # form buat campaign baru
│       │   ├── [id]/page.tsx       # detail & monitor campaign
│       │   └── actions.ts          # server actions: create, schedule, pause
│       └── senders/
│           ├── page.tsx            # list sender phones
│           ├── actions.ts          # server actions: add, update status
│           └── qr-display.tsx      # client component polling QR
└── components/
    ├── sidebar.tsx                 # navigasi sidebar
    ├── stat-card.tsx               # card statistik reusable
    └── data-table.tsx              # tabel dengan pagination reusable
```

---

### Task 1: Sidebar Navigation

**Files:**
- Create: `apps/web/components/sidebar.tsx`
- Modify: `apps/web/app/dashboard/layout.tsx`

- [ ] **Step 1: Install icon library**

```bash
cd "/Applications/Works/QuranBest/Vibe Code/WA Broadcast Tools/apps/web"
npx shadcn@latest add separator badge
pnpm add lucide-react
```

- [ ] **Step 2: Buat apps/web/components/sidebar.tsx**

```tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  Megaphone,
  Image,
  Smartphone,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/dashboard/contacts', label: 'Kontak', icon: Users },
  { href: '/dashboard/campaigns', label: 'Campaign', icon: Megaphone },
  { href: '/dashboard/media', label: 'Media', icon: Image },
  { href: '/dashboard/senders', label: 'Sender WA', icon: Smartphone },
]

export function Sidebar() {
  const pathname = usePathname()
  return (
    <aside className="w-56 bg-white border-r min-h-screen flex flex-col py-6 px-3">
      <div className="px-3 mb-6">
        <span className="font-bold text-lg text-gray-900">WA Broadcast</span>
      </div>
      <nav className="flex flex-col gap-1">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                active
                  ? 'bg-gray-100 text-gray-900 font-medium'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
              )}
            >
              <Icon size={16} />
              {item.label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
```

- [ ] **Step 3: Buat apps/web/lib/utils.ts**

```typescript
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

- [ ] **Step 4: Install clsx dan tailwind-merge**

```bash
cd "/Applications/Works/QuranBest/Vibe Code/WA Broadcast Tools/apps/web"
pnpm add clsx tailwind-merge
```

- [ ] **Step 5: Update apps/web/app/dashboard/layout.tsx**

```tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/sidebar'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <header className="bg-white border-b px-6 py-3 flex justify-end">
          <form action="/api/auth/signout" method="post">
            <button type="submit" className="text-sm text-gray-500 hover:text-gray-700">
              Keluar
            </button>
          </form>
        </header>
        <main className="p-6 flex-1">{children}</main>
      </div>
    </div>
  )
}
```

- [ ] **Step 6: Test sidebar tampil**

```bash
pnpm dev:web
```
Buka http://localhost:3000/dashboard — sidebar harus tampil di kiri dengan 5 menu.

- [ ] **Step 7: Commit**

```bash
git add .
git commit -m "feat: add dashboard sidebar navigation"
```

---

### Task 2: Overview Dashboard (Statistik)

**Files:**
- Create: `apps/web/components/stat-card.tsx`
- Modify: `apps/web/app/dashboard/page.tsx`

- [ ] **Step 1: Buat apps/web/components/stat-card.tsx**

```tsx
interface StatCardProps {
  title: string
  value: string | number
  description?: string
}

export function StatCard({ title, value, description }: StatCardProps) {
  return (
    <div className="bg-white rounded-lg border p-6">
      <p className="text-sm text-gray-500">{title}</p>
      <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
      {description && <p className="text-sm text-gray-400 mt-1">{description}</p>}
    </div>
  )
}
```

- [ ] **Step 2: Update apps/web/app/dashboard/page.tsx**

```tsx
import { createClient } from '@/lib/supabase/server'
import { StatCard } from '@/components/stat-card'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [
    { count: totalContacts },
    { count: totalCampaigns },
    { count: sentToday },
    { data: senders },
  ] = await Promise.all([
    supabase.from('contacts').select('*', { count: 'exact', head: true }).eq('user_id', user!.id),
    supabase.from('campaigns').select('*', { count: 'exact', head: true }).eq('user_id', user!.id),
    supabase.from('campaign_contacts').select('*', { count: 'exact', head: true })
      .eq('status', 'sent')
      .gte('sent_at', new Date().toISOString().split('T')[0]),
    supabase.from('sender_phones').select('status').eq('user_id', user!.id),
  ])

  const activeSenders = senders?.filter(s => s.status === 'active').length ?? 0

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Overview</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Kontak" value={totalContacts ?? 0} />
        <StatCard title="Total Campaign" value={totalCampaigns ?? 0} />
        <StatCard title="Terkirim Hari Ini" value={sentToday ?? 0} />
        <StatCard
          title="Sender Aktif"
          value={activeSenders}
          description={`dari ${senders?.length ?? 0} nomor`}
        />
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add .
git commit -m "feat: add overview stats dashboard"
```

---

### Task 3: Manajemen Kontak

**Files:**
- Create: `apps/web/app/dashboard/contacts/page.tsx`
- Create: `apps/web/app/dashboard/contacts/actions.ts`
- Create: `apps/web/app/dashboard/contacts/import-form.tsx`

- [ ] **Step 1: Install papaparse untuk CSV**

```bash
cd "/Applications/Works/QuranBest/Vibe Code/WA Broadcast Tools/apps/web"
pnpm add papaparse
pnpm add -D @types/papaparse
npx shadcn@latest add table dialog alert-dialog
```

- [ ] **Step 2: Buat apps/web/app/dashboard/contacts/actions.ts**

```typescript
'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function importContacts(contacts: Array<{ phone: string; name?: string; tags?: string }>) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const rows = contacts
    .filter(c => c.phone?.trim())
    .map(c => ({
      user_id: user.id,
      phone: c.phone.trim().replace(/\D/g, ''),
      name: c.name?.trim() || null,
      tags: c.tags ? c.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
    }))

  const { error } = await supabase
    .from('contacts')
    .upsert(rows, { onConflict: 'user_id,phone', ignoreDuplicates: false })

  if (error) return { error: error.message }
  revalidatePath('/dashboard/contacts')
  return { success: true, count: rows.length }
}

export async function deleteContact(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('contacts').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/dashboard/contacts')
  return { success: true }
}
```

- [ ] **Step 3: Buat apps/web/app/dashboard/contacts/import-form.tsx**

```tsx
'use client'

import { useState, useRef } from 'react'
import Papa from 'papaparse'
import { Button } from '@/components/ui/button'
import { importContacts } from './actions'

export function ImportForm() {
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setLoading(true)
    setStatus('Membaca file...')

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const rows = results.data as Array<{ phone: string; name?: string; tags?: string }>
        setStatus(`Mengimpor ${rows.length} kontak...`)
        const result = await importContacts(rows)
        if (result.error) {
          setStatus(`Error: ${result.error}`)
        } else {
          setStatus(`Berhasil import ${result.count} kontak`)
        }
        setLoading(false)
        if (inputRef.current) inputRef.current.value = ''
      },
    })
  }

  return (
    <div className="flex items-center gap-3">
      <input
        ref={inputRef}
        type="file"
        accept=".csv"
        className="hidden"
        id="csv-upload"
        onChange={handleFile}
        disabled={loading}
      />
      <Button asChild variant="outline" disabled={loading}>
        <label htmlFor="csv-upload" className="cursor-pointer">
          {loading ? 'Mengimpor...' : 'Import CSV'}
        </label>
      </Button>
      {status && <span className="text-sm text-gray-500">{status}</span>}
    </div>
  )
}
```

- [ ] **Step 4: Buat apps/web/app/dashboard/contacts/page.tsx**

```tsx
import { createClient } from '@/lib/supabase/server'
import { ImportForm } from './import-form'
import { deleteContact } from './actions'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export default async function ContactsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: contacts } = await supabase
    .from('contacts')
    .select('*')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })
    .limit(100)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Kontak</h1>
        <ImportForm />
      </div>
      <p className="text-sm text-gray-500 mb-2">
        Format CSV: kolom <code className="bg-gray-100 px-1 rounded">phone</code>,{' '}
        <code className="bg-gray-100 px-1 rounded">name</code> (opsional),{' '}
        <code className="bg-gray-100 px-1 rounded">tags</code> (opsional, pisah koma)
      </p>
      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Nomor</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Nama</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Tags</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {contacts?.map((contact) => (
              <tr key={contact.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-mono">{contact.phone}</td>
                <td className="px-4 py-3">{contact.name ?? '-'}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-1 flex-wrap">
                    {contact.tags?.map((tag: string) => (
                      <Badge key={tag} variant="secondary">{tag}</Badge>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3">
                  {contact.is_blocked ? (
                    <Badge variant="destructive">Blocked</Badge>
                  ) : contact.opt_out_at ? (
                    <Badge variant="outline">Opt-out</Badge>
                  ) : (
                    <Badge className="bg-green-100 text-green-700">Aktif</Badge>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <form action={async () => { 'use server'; await deleteContact(contact.id) }}>
                    <Button variant="ghost" size="sm" type="submit"
                      className="text-red-500 hover:text-red-700">
                      Hapus
                    </Button>
                  </form>
                </td>
              </tr>
            ))}
            {!contacts?.length && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                  Belum ada kontak. Import CSV untuk memulai.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "feat: add contacts management with CSV import"
```

---

### Task 4: Manajemen Media

**Files:**
- Create: `apps/web/app/dashboard/media/page.tsx`
- Create: `apps/web/app/dashboard/media/actions.ts`
- Create: `apps/web/app/dashboard/media/upload-form.tsx`

- [ ] **Step 1: Buat apps/web/app/dashboard/media/actions.ts**

```typescript
'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function deleteMedia(id: string, storagePath: string) {
  const supabase = await createClient()
  await supabase.storage.from('media').remove([storagePath])
  const { error } = await supabase.from('media_files').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/dashboard/media')
  return { success: true }
}
```

- [ ] **Step 2: Buat apps/web/app/dashboard/media/upload-form.tsx**

```tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export function UploadForm() {
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setLoading(true)
    setStatus('Mengupload...')

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setStatus('Error: tidak login'); setLoading(false); return }

    const ext = file.name.split('.').pop()
    const path = `${user.id}/${Date.now()}.${ext}`
    const { error: uploadError } = await supabase.storage.from('media').upload(path, file)
    if (uploadError) { setStatus(`Error: ${uploadError.message}`); setLoading(false); return }

    const { data: urlData } = supabase.storage.from('media').getPublicUrl(path)
    const fileType = file.type.startsWith('image/') ? 'image'
      : file.type.startsWith('video/') ? 'video' : 'document'

    const { error: dbError } = await supabase.from('media_files').insert({
      user_id: user.id,
      filename: file.name,
      storage_path: path,
      public_url: urlData.publicUrl,
      file_type: fileType,
      file_size: file.size,
    })

    if (dbError) { setStatus(`Error: ${dbError.message}`); setLoading(false); return }
    setStatus('Upload berhasil!')
    setLoading(false)
    router.refresh()
  }

  return (
    <div className="flex items-center gap-3">
      <input
        type="file"
        accept="image/*,application/pdf,.doc,.docx"
        className="hidden"
        id="media-upload"
        onChange={handleFile}
        disabled={loading}
      />
      <Button asChild disabled={loading}>
        <label htmlFor="media-upload" className="cursor-pointer">
          {loading ? 'Mengupload...' : 'Upload Media'}
        </label>
      </Button>
      {status && <span className="text-sm text-gray-500">{status}</span>}
    </div>
  )
}
```

- [ ] **Step 3: Buat apps/web/app/dashboard/media/page.tsx**

```tsx
import { createClient } from '@/lib/supabase/server'
import { UploadForm } from './upload-form'
import { deleteMedia } from './actions'
import { Button } from '@/components/ui/button'
import Image from 'next/image'

export default async function MediaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: files } = await supabase
    .from('media_files')
    .select('*')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Media</h1>
        <UploadForm />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {files?.map((file) => (
          <div key={file.id} className="bg-white rounded-lg border overflow-hidden group">
            {file.file_type === 'image' ? (
              <div className="relative aspect-square bg-gray-100">
                <Image src={file.public_url} alt={file.filename} fill className="object-cover" />
              </div>
            ) : (
              <div className="aspect-square bg-gray-100 flex items-center justify-center">
                <span className="text-3xl">📄</span>
              </div>
            )}
            <div className="p-2">
              <p className="text-xs text-gray-600 truncate">{file.filename}</p>
              <div className="flex gap-1 mt-1">
                <Button
                  variant="ghost" size="sm"
                  className="text-xs h-6 px-2"
                  onClick={() => navigator.clipboard.writeText(file.public_url)}
                >
                  Copy URL
                </Button>
                <form action={async () => {
                  'use server'
                  await deleteMedia(file.id, file.storage_path)
                }}>
                  <Button variant="ghost" size="sm" type="submit"
                    className="text-xs h-6 px-2 text-red-500">
                    Hapus
                  </Button>
                </form>
              </div>
            </div>
          </div>
        ))}
        {!files?.length && (
          <div className="col-span-full py-12 text-center text-gray-400">
            Belum ada media. Upload gambar atau dokumen untuk campaign.
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Tambah domain Supabase ke next.config.ts untuk Next Image**

```typescript
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: ['@wa-broadcast/db'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
  },
}

export default nextConfig
```

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "feat: add media management with Supabase Storage upload"
```

---

### Task 5: Manajemen Sender Phones

**Files:**
- Create: `apps/web/app/dashboard/senders/page.tsx`
- Create: `apps/web/app/dashboard/senders/actions.ts`

- [ ] **Step 1: Buat apps/web/app/dashboard/senders/actions.ts**

```typescript
'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function addSender(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase.from('sender_phones').insert({
    user_id: user.id,
    phone_number: (formData.get('phone_number') as string).trim(),
    display_name: (formData.get('display_name') as string).trim() || null,
    status: 'warmup',
  })

  if (error) return { error: error.message }
  revalidatePath('/dashboard/senders')
  return { success: true }
}

export async function deleteSender(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('sender_phones').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/dashboard/senders')
  return { success: true }
}
```

- [ ] **Step 2: Buat apps/web/app/dashboard/senders/page.tsx**

```tsx
import { createClient } from '@/lib/supabase/server'
import { addSender, deleteSender } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

const statusColor: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  warmup: 'bg-yellow-100 text-yellow-700',
  soft_banned: 'bg-red-100 text-red-700',
  recovering: 'bg-orange-100 text-orange-700',
  disabled: 'bg-gray-100 text-gray-500',
}

const statusLabel: Record<string, string> = {
  active: 'Aktif',
  warmup: 'Warm-up',
  soft_banned: 'Soft Banned',
  recovering: 'Pemulihan',
  disabled: 'Nonaktif',
}

export default async function SendersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: senders } = await supabase
    .from('sender_phones')
    .select('*')
    .eq('user_id', user!.id)
    .order('created_at')

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Sender WA</h1>
      </div>

      <div className="bg-white rounded-lg border p-4 mb-6">
        <h2 className="font-medium mb-3">Tambah Nomor Sender</h2>
        <form action={addSender} className="flex gap-3">
          <Input name="phone_number" placeholder="628xxxxxxxxxx" required className="max-w-xs" />
          <Input name="display_name" placeholder="Nama (opsional)" className="max-w-xs" />
          <Button type="submit">Tambah</Button>
        </form>
        <p className="text-xs text-gray-400 mt-2">
          Format: 628xxxxxxxxxx (tanpa + atau spasi). Nomor baru otomatis masuk mode warm-up.
        </p>
      </div>

      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Nomor</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Nama</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Warmup Hari</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Terkirim Hari Ini</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Pulih Pada</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {senders?.map((sender) => (
              <tr key={sender.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-mono">{sender.phone_number}</td>
                <td className="px-4 py-3">{sender.display_name ?? '-'}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColor[sender.status]}`}>
                    {statusLabel[sender.status]}
                  </span>
                </td>
                <td className="px-4 py-3">{sender.warmup_day}/14</td>
                <td className="px-4 py-3">{sender.daily_sent}</td>
                <td className="px-4 py-3 text-xs text-gray-400">
                  {sender.recover_at
                    ? new Date(sender.recover_at).toLocaleString('id-ID')
                    : '-'}
                </td>
                <td className="px-4 py-3 text-right">
                  <form action={async () => { 'use server'; await deleteSender(sender.id) }}>
                    <Button variant="ghost" size="sm" type="submit"
                      className="text-red-500 hover:text-red-700">
                      Hapus
                    </Button>
                  </form>
                </td>
              </tr>
            ))}
            {!senders?.length && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                  Belum ada nomor sender. Tambahkan nomor WA untuk memulai.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {(senders?.length ?? 0) > 0 && (
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-700">
          <strong>Catatan:</strong> QR Code untuk scan Baileys akan tampil setelah worker (Railway) aktif.
          Worker akan update status sender secara otomatis.
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add .
git commit -m "feat: add sender phones management page"
```

---

### Task 6: Buat Campaign

**Files:**
- Create: `apps/web/app/dashboard/campaigns/page.tsx`
- Create: `apps/web/app/dashboard/campaigns/actions.ts`
- Create: `apps/web/app/dashboard/campaigns/new/page.tsx`
- Create: `apps/web/app/dashboard/campaigns/[id]/page.tsx`

- [ ] **Step 1: Buat apps/web/app/dashboard/campaigns/actions.ts**

```typescript
'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function createCampaign(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const scheduledAt = formData.get('scheduled_at') as string
  const senderIds = formData.getAll('sender_ids') as string[]
  const messageType = formData.get('message_type') as string
  const content = formData.get('content') as string
  const mediaUrl = formData.get('media_url') as string || null
  const filterTags = formData.get('filter_tags') as string

  const { data: campaign, error: campaignError } = await supabase
    .from('campaigns')
    .insert({
      user_id: user.id,
      name: formData.get('name') as string,
      status: scheduledAt ? 'scheduled' : 'draft',
      scheduled_at: scheduledAt || null,
      sender_rotation: senderIds,
      target_filter: filterTags
        ? { tags: filterTags.split(',').map(t => t.trim()).filter(Boolean) }
        : null,
    })
    .select()
    .single()

  if (campaignError) return { error: campaignError.message }

  // Simpan pesan campaign
  const { error: msgError } = await supabase.from('campaign_messages').insert({
    campaign_id: campaign.id,
    order_index: 0,
    type: messageType,
    content,
    media_url: mediaUrl,
  })
  if (msgError) return { error: msgError.message }

  // Buat campaign_contacts dari kontak yang sesuai filter
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

  revalidatePath('/dashboard/campaigns')
  redirect(`/dashboard/campaigns/${campaign.id}`)
}

export async function pauseCampaign(id: string) {
  const supabase = await createClient()
  await supabase.from('campaigns').update({ status: 'paused' }).eq('id', id)
  revalidatePath(`/dashboard/campaigns/${id}`)
}

export async function resumeCampaign(id: string) {
  const supabase = await createClient()
  await supabase.from('campaigns').update({ status: 'scheduled' }).eq('id', id)
  revalidatePath(`/dashboard/campaigns/${id}`)
}
```

- [ ] **Step 2: Buat apps/web/app/dashboard/campaigns/new/page.tsx**

```tsx
import { createClient } from '@/lib/supabase/server'
import { createCampaign } from '../actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

export default async function NewCampaignPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: senders }, { data: mediaFiles }] = await Promise.all([
    supabase.from('sender_phones').select('id, phone_number, display_name, status')
      .eq('user_id', user!.id).in('status', ['active', 'warmup']),
    supabase.from('media_files').select('id, filename, public_url, file_type')
      .eq('user_id', user!.id).eq('file_type', 'image'),
  ])

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Buat Campaign Baru</h1>
      <form action={createCampaign} className="space-y-5 bg-white rounded-lg border p-6">
        <div className="space-y-2">
          <Label htmlFor="name">Nama Campaign</Label>
          <Input id="name" name="name" placeholder="Promo Ramadan 2026" required />
        </div>

        <div className="space-y-2">
          <Label>Sender WA</Label>
          <div className="space-y-2">
            {senders?.map(s => (
              <label key={s.id} className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="sender_ids" value={s.id} />
                {s.display_name ?? s.phone_number}
                <span className="text-xs text-gray-400">({s.status})</span>
              </label>
            ))}
            {!senders?.length && (
              <p className="text-sm text-red-500">Belum ada sender aktif. Tambah di halaman Sender WA.</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="filter_tags">Filter Tag Kontak (opsional)</Label>
          <Input id="filter_tags" name="filter_tags" placeholder="pelanggan,vip (pisah koma)" />
          <p className="text-xs text-gray-400">Kosongkan untuk kirim ke semua kontak aktif</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="message_type">Tipe Pesan</Label>
          <select id="message_type" name="message_type"
            className="w-full border rounded-md px-3 py-2 text-sm" defaultValue="text">
            <option value="text">Teks saja</option>
            <option value="image">Gambar + teks</option>
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="content">Isi Pesan (support spintax)</Label>
          <Textarea
            id="content" name="content" required
            placeholder="Halo {nama}! {Promo ini|Penawaran spesial ini} untuk Anda 🎉"
            rows={4}
          />
          <p className="text-xs text-gray-400">
            Gunakan {'{nama}'} untuk nama kontak. Spintax: {'{opsi1|opsi2}'}
          </p>
        </div>

        {mediaFiles && mediaFiles.length > 0 && (
          <div className="space-y-2">
            <Label htmlFor="media_url">Gambar (opsional)</Label>
            <select id="media_url" name="media_url"
              className="w-full border rounded-md px-3 py-2 text-sm">
              <option value="">Tanpa gambar</option>
              {mediaFiles.map(f => (
                <option key={f.id} value={f.public_url}>{f.filename}</option>
              ))}
            </select>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="scheduled_at">Jadwal Kirim (opsional)</Label>
          <Input id="scheduled_at" name="scheduled_at" type="datetime-local" />
          <p className="text-xs text-gray-400">Kosongkan untuk simpan sebagai draft</p>
        </div>

        <div className="flex gap-3">
          <Button type="submit">Simpan Campaign</Button>
          <Button type="button" variant="outline" asChild>
            <a href="/dashboard/campaigns">Batal</a>
          </Button>
        </div>
      </form>
    </div>
  )
}
```

- [ ] **Step 3: Buat apps/web/app/dashboard/campaigns/page.tsx**

```tsx
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'

const statusColor: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600',
  scheduled: 'bg-blue-100 text-blue-700',
  running: 'bg-yellow-100 text-yellow-700',
  paused: 'bg-orange-100 text-orange-700',
  done: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
}

export default async function CampaignsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: campaigns } = await supabase
    .from('campaigns')
    .select('*')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Campaign</h1>
        <Button asChild>
          <Link href="/dashboard/campaigns/new">+ Buat Campaign</Link>
        </Button>
      </div>
      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Nama</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Jadwal</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {campaigns?.map((campaign) => (
              <tr key={campaign.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{campaign.name}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColor[campaign.status]}`}>
                    {campaign.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-400 text-xs">
                  {campaign.scheduled_at
                    ? new Date(campaign.scheduled_at).toLocaleString('id-ID')
                    : '-'}
                </td>
                <td className="px-4 py-3 text-right">
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/dashboard/campaigns/${campaign.id}`}>Detail</Link>
                  </Button>
                </td>
              </tr>
            ))}
            {!campaigns?.length && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-gray-400">
                  Belum ada campaign.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Buat apps/web/app/dashboard/campaigns/[id]/page.tsx**

```tsx
import { createClient } from '@/lib/supabase/server'
import { pauseCampaign, resumeCampaign } from '../actions'
import { Button } from '@/components/ui/button'
import { notFound } from 'next/navigation'

export default async function CampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: campaign }, { data: stats }] = await Promise.all([
    supabase.from('campaigns').select('*, campaign_messages(*)').eq('id', id).single(),
    supabase.from('campaign_contacts').select('status').eq('campaign_id', id),
  ])

  if (!campaign) notFound()

  const counts = {
    total: stats?.length ?? 0,
    pending: stats?.filter(s => s.status === 'pending').length ?? 0,
    sent: stats?.filter(s => s.status === 'sent').length ?? 0,
    delivered: stats?.filter(s => s.status === 'delivered').length ?? 0,
    failed: stats?.filter(s => s.status === 'failed').length ?? 0,
    skipped: stats?.filter(s => s.status === 'skipped').length ?? 0,
  }

  const successRate = counts.total > 0
    ? Math.round((counts.delivered / counts.total) * 100)
    : 0

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{campaign.name}</h1>
          <p className="text-sm text-gray-500 mt-1">
            Status: <strong>{campaign.status}</strong>
            {campaign.scheduled_at && (
              <> · Jadwal: {new Date(campaign.scheduled_at).toLocaleString('id-ID')}</>
            )}
          </p>
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
          <div key={stat.label} className="bg-white rounded-lg border p-4">
            <p className="text-sm text-gray-500">{stat.label}</p>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
          </div>
        ))}
      </div>

      {campaign.campaign_messages?.[0] && (
        <div className="bg-white rounded-lg border p-4">
          <h2 className="font-medium mb-2">Isi Pesan</h2>
          <p className="text-sm text-gray-600 whitespace-pre-wrap">
            {campaign.campaign_messages[0].content}
          </p>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 5: Install textarea shadcn component**

```bash
cd "/Applications/Works/QuranBest/Vibe Code/WA Broadcast Tools/apps/web"
npx shadcn@latest add textarea
```

- [ ] **Step 6: Commit**

```bash
git add .
git commit -m "feat: add campaign management (create, list, detail, pause/resume)"
```

---

## Verifikasi Plan 2 Selesai

- [ ] `pnpm dev:web` → semua 5 halaman dashboard bisa dibuka tanpa error
- [ ] Import CSV di halaman Kontak → kontak tersimpan di Supabase
- [ ] Upload gambar di halaman Media → file muncul di Supabase Storage
- [ ] Buat campaign baru → tersimpan, muncul di list
- [ ] Tambah sender phone → muncul di tabel dengan status warmup

**Lanjut ke Plan 3** (Railway Worker: Baileys, scheduler, anti-ban, spintax).
