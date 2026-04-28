import { redirect } from 'next/navigation'
import { getUserRole } from '@/lib/get-user-role'
import { Sidebar } from '@/components/sidebar'
import { WorkerStatusBar } from '@/components/worker-status-bar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const profile = await getUserRole()
  if (!profile) redirect('/login')
  if (!profile.isActive) redirect('/login?error=account_disabled')

  return (
    <div className="flex flex-col min-h-screen bg-[#f8f8f7]">
      <WorkerStatusBar />
      <div className="flex flex-1 min-h-0">
        <Sidebar role={profile.role} />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="bg-white border-b border-[#e8e8e6] px-6 h-12 flex items-center justify-between sticky top-0 z-10">
            <a
              href="/panduan-anti-banned.html"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-[12px] font-medium px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-colors"
            >
              <span>⚠️</span>
              Panduan Anti Banned
            </a>
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
    </div>
  )
}
