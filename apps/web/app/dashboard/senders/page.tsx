import { createClient } from '@/lib/supabase/server'
import { addSender, deleteSender } from './actions'
import { QRButton } from './qr-button'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

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
        <form action={addSender as (formData: FormData) => void} className="flex gap-3">
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
                  <div className="flex gap-2 justify-end items-center">
                    <QRButton senderId={sender.id} />
                    <form action={async () => { 'use server'; await deleteSender(sender.id) }}>
                      <Button variant="ghost" size="sm" type="submit"
                        className="h-7 w-7 p-0 text-gray-400 hover:text-red-500 hover:bg-red-50">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6"/>
                          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                          <path d="M10 11v6M14 11v6"/>
                          <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                        </svg>
                      </Button>
                    </form>
                  </div>
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
