import { createClient } from '@/lib/supabase/server'
import { createCampaign } from '../actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { WhatsAppEditor } from '@/components/whatsapp-editor'

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
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Buat Campaign Baru</h1>
      </div>
      <form action={createCampaign as (formData: FormData) => void} className="space-y-5 bg-white rounded-lg border p-6">
        <div className="space-y-2">
          <Label htmlFor="name">Nama Campaign</Label>
          <Input id="name" name="name" placeholder="Promo Ramadan 2026" required />
        </div>

        <div className="space-y-2">
          <Label>Sender WA</Label>
          <div className="space-y-2">
            {senders?.map(s => (
              <label key={s.id} className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" name="sender_ids" value={s.id} />
                <span>{s.display_name ?? s.phone_number}</span>
                {s.status === 'active' ? (
                  <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-medium bg-[#25D366] text-white">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white" />
                    </span>
                    Aktif
                  </span>
                ) : (
                  <span className={{
                    warmup:      'text-[11px] px-2 py-0.5 rounded-full font-medium bg-amber-50 text-amber-600',
                    soft_banned: 'text-[11px] px-2 py-0.5 rounded-full font-medium bg-red-50 text-red-500',
                    recovering:  'text-[11px] px-2 py-0.5 rounded-full font-medium bg-orange-50 text-orange-500',
                    disabled:    'text-[11px] px-2 py-0.5 rounded-full font-medium bg-[#f2f2f0] text-[#7a7a7a]',
                  }[s.status] ?? 'text-[11px] px-2 py-0.5 rounded-full font-medium bg-[#f2f2f0] text-[#7a7a7a]'}>
                    {{ warmup: 'Warm-up', soft_banned: 'Soft Banned', recovering: 'Pemulihan', disabled: 'Nonaktif' }[s.status] ?? s.status}
                  </span>
                )}
              </label>
            ))}
            {!senders?.length && (
              <p className="text-sm text-red-500">Belum ada sender aktif. Tambah di halaman Sender WA.</p>
            )}
          </div>
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
          <WhatsAppEditor
            name="content"
            required
            placeholder="Halo {nama}! {Promo ini|Penawaran spesial ini} untuk Anda 🎉"
            rows={8}
          />
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
          <a href="/dashboard/campaigns"
            className="inline-flex items-center justify-center rounded-lg border border-border bg-background h-8 px-2.5 text-sm font-medium hover:bg-muted transition-all">
            Batal
          </a>
        </div>
      </form>
    </div>
  )
}
