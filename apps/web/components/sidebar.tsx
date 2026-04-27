'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  Megaphone,
  Image,
  Smartphone,
  ShieldCheck,
  Radio,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/dashboard/contacts', label: 'Kontak', icon: Users },
  { href: '/dashboard/campaigns', label: 'Campaign', icon: Megaphone },
  { href: '/dashboard/media', label: 'Media', icon: Image },
  { href: '/dashboard/senders', label: 'Sender WA', icon: Smartphone },
]

const adminItems = [
  { href: '/admin/users', label: 'Kelola User', icon: ShieldCheck },
  { href: '/admin/senders', label: 'Semua Sender', icon: Smartphone },
  { href: '/admin/campaigns', label: 'History Broadcast', icon: Radio },
]

export function Sidebar({ role }: { role?: string }) {
  const pathname = usePathname()
  const allItems = role === 'superadmin' ? [...navItems, ...adminItems] : navItems

  return (
    <aside className="w-56 bg-white border-r border-[#e8e8e6] min-h-screen flex flex-col py-5 px-3 shrink-0">
      <div className="px-3 mb-7 flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-[#25D366] flex items-center justify-center shrink-0">
          <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white" xmlns="http://www.w3.org/2000/svg">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
            <path d="M12 0C5.373 0 0 5.373 0 12c0 2.125.558 4.115 1.533 5.838L0 24l6.338-1.51A11.93 11.93 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.787 9.787 0 0 1-5.003-1.368l-.36-.213-3.76.896.952-3.653-.235-.374A9.76 9.76 0 0 1 2.182 12C2.182 6.575 6.575 2.182 12 2.182S21.818 6.575 21.818 12 17.425 21.818 12 21.818z"/>
          </svg>
        </div>
        <span className="font-semibold text-sm text-[#111111] tracking-tight">Blastify</span>
      </div>

      <nav className="flex flex-col gap-0.5 flex-1">
        {allItems.map((item) => {
          const Icon = item.icon
          const active = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] font-medium transition-colors duration-150',
                active
                  ? 'bg-[#f2f2f0] text-[#111111]'
                  : 'text-[#7a7a7a] hover:text-[#111111] hover:bg-[#f8f8f7]'
              )}
            >
              <Icon size={15} strokeWidth={active ? 2.5 : 2} className={active ? 'text-[#25D366]' : ''} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {role === 'superadmin' && (
        <div className="mt-4 px-3 py-1.5 rounded-md bg-[#f0fdf4] border border-[#bbf7d0]">
          <p className="text-[11px] text-[#25D366] font-semibold uppercase tracking-widest">Superadmin</p>
        </div>
      )}
    </aside>
  )
}
