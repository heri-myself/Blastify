import { createAdminClient } from '@/lib/supabase/admin'
import { getUserRole } from '@/lib/get-user-role'
import { addSender, deleteSender } from './actions'
import { QRButton } from './qr-button'
import { AddSenderAdminForm } from './add-sender-admin-form'

const statusStyle: Record<string, string> = {
  active:      'bg-[#25D366] text-white shadow-sm',
  warmup:      'bg-amber-50 text-amber-600',
  soft_banned: 'bg-red-50 text-red-500',
  recovering:  'bg-orange-50 text-orange-500',
  disabled:    'bg-[#f2f2f0] text-[#7a7a7a]',
}

const statusLabel: Record<string, string> = {
  active: 'Aktif', warmup: 'Warm-up', soft_banned: 'Soft Banned',
  recovering: 'Pemulihan', disabled: 'Nonaktif',
}

export default async function SendersPage() {
  const profile = await getUserRole()
  const isSuperadmin = profile?.role === 'superadmin'

  const admin = createAdminClient()

  // Superadmin: semua sender. User biasa: miliknya saja.
  const query = admin.from('sender_phones').select('*').order('created_at')
  const { data: senders } = isSuperadmin
    ? await query
    : await query.eq('user_id', profile!.userId)

  // Untuk superadmin: ambil mapping email + list user untuk form
  let emailMap: Record<string, string> = {}
  let userList: { id: string; email: string }[] = []
  if (isSuperadmin) {
    const { data: { users } } = await admin.auth.admin.listUsers()
    emailMap = Object.fromEntries(users.map(u => [u.id, u.email ?? u.id.slice(0, 8)]))
    userList = users
      .filter(u => u.email)
      .map(u => ({ id: u.id, email: u.email! }))
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-[#111111]">Sender WA</h1>
        <p className="text-[13px] text-[#7a7a7a] mt-0.5">
          {isSuperadmin
            ? `Semua nomor sender dari seluruh user — ${senders?.length ?? 0} nomor`
            : 'Kelola nomor WhatsApp untuk broadcast'}
        </p>
      </div>

      {isSuperadmin && <AddSenderAdminForm users={userList} />}

      {!isSuperadmin && (
        <div className="bg-white rounded-xl border border-[#e8e8e6] p-5 mb-5">
          <p className="text-[13px] font-medium text-[#111111] mb-3">Tambah Nomor Sender</p>
          <form action={addSender as (formData: FormData) => void} className="flex gap-2.5 flex-wrap">
            <input
              name="phone_number"
              placeholder="628xxxxxxxxxx"
              required
              className="h-9 px-3 rounded-lg border border-[#e8e8e6] bg-[#f8f8f7] text-[13px] font-mono placeholder:text-[#b0b0b0] outline-none focus:border-[#111111] transition-colors w-52"
            />
            <input
              name="display_name"
              placeholder="Nama (opsional)"
              className="h-9 px-3 rounded-lg border border-[#e8e8e6] bg-[#f8f8f7] text-[13px] placeholder:text-[#b0b0b0] outline-none focus:border-[#111111] transition-colors w-48"
            />
            <button type="submit" className="h-9 px-4 rounded-lg bg-[#111111] text-white text-[13px] font-medium hover:bg-[#2a2a2a] transition-colors">
              Tambah
            </button>
          </form>
          <p className="text-[12px] text-[#a0a0a0] mt-2">
            Format: 628xxxxxxxxxx · Nomor baru otomatis masuk mode warm-up.
          </p>
        </div>
      )}

      <div className="bg-white rounded-xl border border-[#e8e8e6] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#e8e8e6]">
              {isSuperadmin && <th className="text-left px-4 py-3 text-[12px] font-medium text-[#7a7a7a] uppercase tracking-wider">User</th>}
              <th className="text-left px-4 py-3 text-[12px] font-medium text-[#7a7a7a] uppercase tracking-wider">Nomor</th>
              <th className="text-left px-4 py-3 text-[12px] font-medium text-[#7a7a7a] uppercase tracking-wider">Nama</th>
              <th className="text-left px-4 py-3 text-[12px] font-medium text-[#7a7a7a] uppercase tracking-wider">Status</th>
              <th className="text-left px-4 py-3 text-[12px] font-medium text-[#7a7a7a] uppercase tracking-wider">Warmup</th>
              <th className="text-left px-4 py-3 text-[12px] font-medium text-[#7a7a7a] uppercase tracking-wider">Terkirim</th>
              <th className="text-left px-4 py-3 text-[12px] font-medium text-[#7a7a7a] uppercase tracking-wider">Pulih Pada</th>
              {!isSuperadmin && <th className="px-4 py-3" />}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f2f2f0]">
            {senders?.map((sender) => (
              <tr key={sender.id} className="hover:bg-[#f8f8f7] transition-colors">
                {isSuperadmin && (
                  <td className="px-4 py-3 text-[13px] text-[#7a7a7a]">
                    {emailMap[sender.user_id] ?? sender.user_id.slice(0, 8)}
                  </td>
                )}
                <td className="px-4 py-3 font-mono text-[13px] text-[#111111]">{sender.phone_number}</td>
                <td className="px-4 py-3 text-[13px] text-[#111111]">{sender.display_name ?? '—'}</td>
                <td className="px-4 py-3">
                  {sender.status === 'active' ? (
                    <span className={`inline-flex items-center gap-1.5 text-[12px] px-2.5 py-1 rounded-full font-medium ${statusStyle.active}`}>
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
                      </span>
                      {statusLabel.active}
                    </span>
                  ) : (
                    <span className={`text-[12px] px-2.5 py-1 rounded-full font-medium ${statusStyle[sender.status] ?? ''}`}>
                      {statusLabel[sender.status] ?? sender.status}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-[13px] text-[#7a7a7a]">{sender.warmup_day}/14</td>
                <td className="px-4 py-3 text-[13px] text-[#7a7a7a]">{sender.daily_sent}</td>
                <td className="px-4 py-3 text-[13px] text-[#7a7a7a] font-mono">
                  {sender.recover_at ? new Date(sender.recover_at).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }) : '—'}
                </td>
                {!isSuperadmin && (
                  <td className="px-4 py-3">
                    <div className="flex gap-2 justify-end items-center">
                      <QRButton senderId={sender.id} />
                      <form action={async () => { 'use server'; await deleteSender(sender.id) }}>
                        <button type="submit" className="text-[#a0a0a0] hover:text-red-500 transition-colors p-1 rounded-md hover:bg-red-50">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                            <path d="M10 11v6M14 11v6"/>
                            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                          </svg>
                        </button>
                      </form>
                    </div>
                  </td>
                )}
              </tr>
            ))}
            {!senders?.length && (
              <tr>
                <td colSpan={isSuperadmin ? 7 : 8} className="px-4 py-12 text-center text-[#a0a0a0] text-[13px]">
                  Belum ada nomor sender.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
