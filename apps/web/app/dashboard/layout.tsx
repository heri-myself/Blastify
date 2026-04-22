import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/sidebar'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <header className="bg-white border-b px-6 py-3 flex justify-end">
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
