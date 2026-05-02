import { redirect } from 'next/navigation'
import { getUserRole } from '@/lib/get-user-role'
import { Sidebar } from '@/components/sidebar'
import { ThemeToggle } from '@/components/theme-toggle'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const profile = await getUserRole()
  if (!profile) redirect('/login')
  if (!profile.isActive) redirect('/login?error=account_disabled')

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar role={profile.role} />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-card border-b border-border px-6 h-12 flex items-center justify-between sticky top-0 z-10 backdrop-blur-sm">
          <a
            href="/panduan-anti-banned.html"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-[12px] font-medium px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 transition-colors"
          >
            Panduan Anti Banned
          </a>
          <div className="flex items-center gap-3">
            <span className="text-[13px] text-muted-foreground hidden sm:block">{profile.email}</span>
            <div className="w-px h-4 bg-border" />
            <ThemeToggle />
            <div className="w-px h-4 bg-border" />
            <form action="/api/auth/signout" method="post">
              <button type="submit" className="text-[13px] text-muted-foreground hover:text-foreground transition-colors">
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
