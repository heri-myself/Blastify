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
