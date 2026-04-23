import { createClient } from '@/lib/supabase/server'
import { ImportForm } from './import-form'
import { AddContactForm } from './add-contact-form'
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
        <div className="flex items-center gap-2">
          <AddContactForm />
          <ImportForm />
        </div>
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
