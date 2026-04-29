# Add Contact Manual Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tambahkan tombol "Tambah Kontak" di halaman kontak yang membuka dialog modal untuk input nomor HP, nama, dan tags secara manual.

**Architecture:** Tambah server action `addContact` di `actions.ts`, buat client component `add-contact-form.tsx` dengan Dialog dari shadcn/ui, lalu render komponen tersebut di `page.tsx`.

**Tech Stack:** Next.js App Router, Supabase, shadcn/ui Dialog, React useState

---

### Task 1: Tambah server action `addContact`

**Files:**
- Modify: `apps/web/app/dashboard/contacts/actions.ts`

- [ ] **Step 1: Tambah function `addContact` di `actions.ts`**

Tambahkan di bawah function `importContacts`:

```ts
export async function addContact(data: { phone: string; name?: string; tags?: string }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const phone = data.phone.trim().replace(/\D/g, '')
  if (!phone) return { error: 'Nomor HP tidak boleh kosong' }

  const { error } = await supabase
    .from('contacts')
    .upsert(
      [{
        user_id: user.id,
        phone,
        name: data.name?.trim() || null,
        tags: data.tags ? data.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      }],
      { onConflict: 'user_id,phone', ignoreDuplicates: false }
    )

  if (error) return { error: error.message }
  revalidatePath('/dashboard/contacts')
  return { success: true }
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/app/dashboard/contacts/actions.ts
git commit -m "feat: add addContact server action"
```

---

### Task 2: Buat komponen `AddContactForm`

**Files:**
- Create: `apps/web/app/dashboard/contacts/add-contact-form.tsx`

- [ ] **Step 1: Buat file `add-contact-form.tsx`**

```tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { addContact } from './actions'

export function AddContactForm() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const form = e.currentTarget
    const data = {
      phone: (form.elements.namedItem('phone') as HTMLInputElement).value,
      name: (form.elements.namedItem('name') as HTMLInputElement).value,
      tags: (form.elements.namedItem('tags') as HTMLInputElement).value,
    }
    const result = await addContact(data)
    if (result.error) {
      setError(result.error)
      setLoading(false)
    } else {
      setOpen(false)
      form.reset()
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">+ Tambah Kontak</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Tambah Kontak</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1">
            <Label htmlFor="phone">Nomor HP *</Label>
            <Input id="phone" name="phone" type="tel" placeholder="628123456789" required />
          </div>
          <div className="space-y-1">
            <Label htmlFor="name">Nama (opsional)</Label>
            <Input id="name" name="name" type="text" placeholder="Nama kontak" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="tags">Tags (opsional, pisah koma)</Label>
            <Input id="tags" name="tags" type="text" placeholder="pelanggan, vip" />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Batal</Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/app/dashboard/contacts/add-contact-form.tsx
git commit -m "feat: add AddContactForm dialog component"
```

---

### Task 3: Integrasikan ke halaman contacts

**Files:**
- Modify: `apps/web/app/dashboard/contacts/page.tsx`

- [ ] **Step 1: Import dan render `AddContactForm` di `page.tsx`**

Tambah import di baris 3:
```tsx
import { AddContactForm } from './add-contact-form'
```

Ubah baris header dari:
```tsx
<ImportForm />
```
Menjadi:
```tsx
<div className="flex items-center gap-2">
  <AddContactForm />
  <ImportForm />
</div>
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/app/dashboard/contacts/page.tsx
git commit -m "feat: integrate AddContactForm into contacts page"
```
