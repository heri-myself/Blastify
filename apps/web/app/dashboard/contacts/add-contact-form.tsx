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
      <DialogTrigger>
        <span className="inline-flex items-center justify-center rounded-lg border border-border bg-background h-8 px-2.5 text-sm font-medium transition-all cursor-pointer hover:bg-muted">
          + Tambah Kontak
        </span>
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
