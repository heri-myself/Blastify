import { createClient } from '@/lib/supabase/server'
import { ImportForm } from './import-form'
import { AddContactForm } from './add-contact-form'
import { deleteContact } from './actions'

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

      <div className="bg-white rounded-xl border border-[#e8e8e6] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#e8e8e6]">
              <th className="text-left px-4 py-3 text-[12px] font-medium text-[#7a7a7a] uppercase tracking-wider">Nomor</th>
              <th className="text-left px-4 py-3 text-[12px] font-medium text-[#7a7a7a] uppercase tracking-wider">Nama</th>
              <th className="text-left px-4 py-3 text-[12px] font-medium text-[#7a7a7a] uppercase tracking-wider">Tags</th>
              <th className="text-left px-4 py-3 text-[12px] font-medium text-[#7a7a7a] uppercase tracking-wider">Status</th>
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
                <td colSpan={5} className="px-4 py-12 text-center text-[#a0a0a0] text-[13px]">
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
