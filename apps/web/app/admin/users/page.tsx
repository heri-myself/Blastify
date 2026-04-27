import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { CreateUserForm } from './create-user-form'
import { UserActions } from './user-actions'

export default async function AdminUsersPage() {
  const admin = createAdminClient()
  const supabase = await createClient()

  const { data: { users } } = await admin.auth.admin.listUsers()
  const { data: profiles } = await supabase.from('profiles').select('id, role, is_active')

  const profileMap = Object.fromEntries((profiles ?? []).map(p => [p.id, p]))

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Kelola User</h1>
        <p className="text-sm text-gray-500 mt-1">Buat dan kelola akun pengguna</p>
      </div>

      <div className="bg-white border rounded-lg p-6 space-y-4">
        <h2 className="font-semibold text-gray-800">Buat User Baru</h2>
        <CreateUserForm />
      </div>

      <div className="bg-white border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Email</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Role</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Dibuat</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y">
            {users.map(user => {
              const profile = profileMap[user.id]
              const isActive = profile?.is_active ?? true
              const role = profile?.role ?? 'user'
              return (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-900">{user.email}</td>
                  <td className="px-4 py-3">
                    <Badge variant={role === 'superadmin' ? 'default' : 'outline'}>
                      {role === 'superadmin' ? 'Superadmin' : 'User'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={isActive ? 'default' : 'secondary'}>
                      {isActive ? 'Aktif' : 'Nonaktif'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(user.created_at).toLocaleDateString('id-ID')}
                  </td>
                  <td className="px-4 py-3">
                    {role !== 'superadmin' && (
                      <UserActions userId={user.id} isActive={isActive} />
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
