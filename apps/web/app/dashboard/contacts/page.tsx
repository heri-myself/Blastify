import { createAdminClient } from '@/lib/supabase/admin'
import { getUserRole } from '@/lib/get-user-role'
import { ImportForm } from './import-form'
import { AddContactForm } from './add-contact-form'
import { ContactFilters } from './contact-filters'
import { deleteContact } from './actions'

interface Props {
  searchParams: Promise<{ q?: string; status?: string; user?: string; tag?: string }>
}

export default async function ContactsPage({ searchParams }: Props) {
  const { q, status, user, tag } = await searchParams
  const profile = await getUserRole()
  const admin = createAdminClient()
  const isSuperadmin = profile?.role === 'superadmin'

  let query = admin.from('contacts').select('*').order('created_at', { ascending: false }).limit(500)

  if (!isSuperadmin) {
    query = query.eq('user_id', profile!.userId)
  } else if (user) {
    query = query.eq('user_id', user)
  }

  if (status === 'blocked') query = query.eq('is_blocked', true)
  else if (status === 'optout') query = query.not('opt_out_at', 'is', null)
  else if (status === 'aktif') query = query.eq('is_blocked', false).is('opt_out_at', null)

  if (q) query = query.or(`phone.ilike.%${q}%,name.ilike.%${q}%`)
  if (tag) query = query.contains('tags', [tag])

  let tagsQuery = admin.from('contacts').select('tags')
  if (!isSuperadmin) tagsQuery = tagsQuery.eq('user_id', profile!.userId)
  else if (user) tagsQuery = tagsQuery.eq('user_id', user)

  const [{ data: contacts }, { data: tagsData }] = await Promise.all([query, tagsQuery])

  const allTags = Array.from(new Set((tagsData ?? []).flatMap(c => c.tags ?? []))).sort()

  let users: Array<{ id: string; email: string }> = []
  if (isSuperadmin) {
    const { data } = await admin.auth.admin.listUsers({ perPage: 200 })
    users = (data?.users ?? []).map(u => ({ id: u.id, email: u.email ?? u.id.slice(0, 8) }))
      .sort((a, b) => a.email.localeCompare(b.email))
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-[#111111]">Kontak</h1>
          <p className="text-[13px] text-[#7a7a7a] mt-0.5">
            Format CSV: kolom <code className="bg-[#f2f2f0] px-1 py-0.5 rounded text-[12px]">phone</code>,{' '}
            <code className="bg-[#f2f2f0] px-1 py-0.5 rounded text-[12px]">name</code>,{' '}
            <code className="bg-[#f2f2f0] px-1 py-0.5 rounded text-[12px]">tags</code>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <AddContactForm />
          <ImportForm />
        </div>
      </div>

      <ContactFilters isSuperadmin={isSuperadmin} users={users} allTags={allTags} />

      <div className="bg-white rounded-xl border border-[#e8e8e6] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#e8e8e6]">
              <th className="text-left px-4 py-3 text-[12px] font-medium text-[#7a7a7a] uppercase tracking-wider">Nomor</th>
              <th className="text-left px-4 py-3 text-[12px] font-medium text-[#7a7a7a] uppercase tracking-wider">Nama</th>
              <th className="text-left px-4 py-3 text-[12px] font-medium text-[#7a7a7a] uppercase tracking-wider">Tags</th>
              <th className="text-left px-4 py-3 text-[12px] font-medium text-[#7a7a7a] uppercase tracking-wider">Status</th>
              {isSuperadmin && (
                <th className="text-left px-4 py-3 text-[12px] font-medium text-[#7a7a7a] uppercase tracking-wider">User</th>
              )}
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f2f2f0]">
            {contacts?.map((contact) => (
              <tr key={contact.id} className="hover:bg-[#f8f8f7] transition-colors">
                <td className="px-4 py-3 font-mono text-[13px] text-[#111111]">{contact.phone}</td>
                <td className="px-4 py-3 text-[13px] text-[#111111]">{contact.name ?? '—'}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-1 flex-wrap">
                    {contact.tags?.map((tag: string) => (
                      <span key={tag} className="text-[11px] px-2 py-0.5 rounded-full bg-[#f2f2f0] text-[#7a7a7a] font-medium">
                        {tag}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3">
                  {contact.is_blocked ? (
                    <span className="text-[12px] px-2.5 py-1 rounded-full bg-red-50 text-red-500 font-medium">Blocked</span>
                  ) : contact.opt_out_at ? (
                    <span className="text-[12px] px-2.5 py-1 rounded-full bg-[#f2f2f0] text-[#7a7a7a] font-medium">Opt-out</span>
                  ) : (
                    <span className="text-[12px] px-2.5 py-1 rounded-full bg-[#f0fdf4] text-[#25D366] font-medium">Aktif</span>
                  )}
                </td>
                {isSuperadmin && (
                  <td className="px-4 py-3 text-[12px] text-[#7a7a7a] max-w-[160px] truncate">
                    {users.find(u => u.id === contact.user_id)?.email ?? contact.user_id?.slice(0, 8)}
                  </td>
                )}
                <td className="px-4 py-3 text-right">
                  <form action={async () => { 'use server'; await deleteContact(contact.id) }}>
                    <button type="submit" className="text-[13px] text-[#a0a0a0] hover:text-red-500 transition-colors font-medium">
                      Hapus
                    </button>
                  </form>
                </td>
              </tr>
            ))}
            {!contacts?.length && (
              <tr>
                <td colSpan={isSuperadmin ? 6 : 5} className="px-4 py-12 text-center text-[#a0a0a0] text-[13px]">
                  {q || status || user || tag ? 'Tidak ada kontak yang cocok dengan filter.' : 'Belum ada kontak. Import CSV untuk memulai.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {contacts && contacts.length > 0 && (
        <p className="text-[12px] text-[#a0a0a0] mt-3 text-right">
          Menampilkan {contacts.length} kontak
        </p>
      )}
    </div>
  )
}
