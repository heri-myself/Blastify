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
]

export function Sidebar({ role }: { role?: string }) {
  const pathname = usePathname()

  const allItems = role === 'superadmin' ? [...navItems, ...adminItems] : navItems

  return (
    <aside className="w-56 bg-white border-r min-h-screen flex flex-col py-6 px-3">
      <div className="px-3 mb-6">
        <span className="font-bold text-lg text-gray-900">WA Broadcast</span>
      </div>
      <nav className="flex flex-col gap-1">
        {allItems.map((item) => {
          const Icon = item.icon
          const active = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                active
                  ? 'bg-gray-100 text-gray-900 font-medium'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
              )}
            >
              <Icon size={16} />
              {item.label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
