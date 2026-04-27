import { redirect } from 'next/navigation'
import { getUserRole } from '@/lib/get-user-role'
import { Sidebar } from '@/components/sidebar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const profile = await getUserRole()
  if (!profile || profile.role !== 'superadmin') redirect('/dashboard')

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar role="superadmin" />
      <div className="flex-1 flex flex-col">
        <header className="bg-white border-b px-6 py-3 flex justify-between items-center">
          <span className="text-sm text-gray-500">{profile.email}</span>
          <form action="/api/auth/signout" method="post">
            <button type="submit" className="text-sm text-gray-500 hover:text-gray-700">
              Keluar
            </button>
          </form>
        </header>
        <main className="p-6 flex-1">{children}</main>
      </div>
    </div>
  )
}
