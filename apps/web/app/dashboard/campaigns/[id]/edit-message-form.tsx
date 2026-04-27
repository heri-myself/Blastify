'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { WhatsAppEditor } from '@/components/whatsapp-editor'
import { updateCampaignMessage } from '../actions'

interface Props {
  messageId: string
  campaignId: string
  initialContent: string
}

export function EditMessageForm({ messageId, campaignId, initialContent }: Props) {
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const formData = new FormData(e.currentTarget)
    const result = await updateCampaignMessage(formData)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    } else {
      setEditing(false)
      setLoading(false)
    }
  }

  if (!editing) {
    return (
      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-medium">Isi Pesan</h2>
          <Button variant="outline" size="sm" onClick={() => setEditing(true)}>Edit</Button>
        </div>
        <p className="text-sm text-gray-600 whitespace-pre-wrap">{initialContent}</p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h2 className="font-medium">Edit Pesan</h2>
      </div>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input type="hidden" name="message_id" value={messageId} />
        <input type="hidden" name="campaign_id" value={campaignId} />
        <WhatsAppEditor name="content" rows={8} defaultValue={initialContent} required />
        {error && <p className="text-sm text-red-500">{error}</p>}
        <div className="flex gap-2">
          <Button type="submit" size="sm" disabled={loading}>
            {loading ? 'Menyimpan...' : 'Simpan'}
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => setEditing(false)}>
            Batal
          </Button>
        </div>
      </form>
    </div>
  )
}
