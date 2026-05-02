import { redirect } from 'next/navigation'
import { getUserRole } from '@/lib/get-user-role'
import { Sidebar } from '@/components/sidebar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const profile = await getUserRole()
  if (!profile || profile.role !== 'superadmin') redirect('/dashboard')

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar role="superadmin" />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-card border-b border-border px-6 h-12 flex items-center justify-between sticky top-0 z-10">
          <div />
          <div className="flex items-center gap-4">
            <span className="text-[13px] text-muted-foreground">{profile.email}</span>
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
