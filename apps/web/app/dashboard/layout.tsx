import { redirect } from 'next/navigation'
import { getUserRole } from '@/lib/get-user-role'
import { Sidebar } from '@/components/sidebar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const profile = await getUserRole()
  if (!profile) redirect('/login')
  if (!profile.isActive) redirect('/login?error=account_disabled')

  return (
    <div className="flex min-h-screen bg-[#f8f8f7]">
      <Sidebar role={profile.role} />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-[#e8e8e6] px-6 h-12 flex items-center justify-between sticky top-0 z-10">
          <div />
          <div className="flex items-center gap-4">
            <span className="text-[13px] text-[#7a7a7a]">{profile.email}</span>
            <div className="w-px h-4 bg-[#e8e8e6]" />
            <form action="/api/auth/signout" method="post">
              <button type="submit" className="text-[13px] text-[#7a7a7a] hover:text-[#111111] transition-colors">
                Keluar
              </button>
            </form>
          </div>
        </header>
        <main className="p-6 flex-1">{children}</main>
      </div>
    </div>
  )
}
