'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { User, Heart, Calendar, Users, BookOpen, LogOut } from 'lucide-react'
import { usePortalAuth } from '@/lib/portal/auth'

const navItems = [
  { href: '/portal/profile', label: 'Profile', icon: User },
  { href: '/portal/giving', label: 'Giving', icon: Heart },
  { href: '/portal/events', label: 'Events', icon: Calendar },
  { href: '/portal/groups', label: 'Groups', icon: Users },
  { href: '/portal/directory', label: 'Directory', icon: BookOpen },
]

export function PortalNav() {
  const pathname = usePathname()
  const { user, logout } = usePortalAuth()

  const handleLogout = async () => {
    await logout()
  }

  return (
    <nav className="bg-card border-b border-border sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          <Link href="/portal/profile" className="flex items-center gap-2">
            <span className="font-bold text-church-blue">Grace Nepal</span>
            <span className="text-xs text-muted-foreground hidden sm:inline">Member Portal</span>
          </Link>

          <div className="flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  <item.icon className="size-4" />
                  <span className="hidden sm:inline">{item.label}</span>
                </Link>
              )
            })}
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-destructive hover:bg-destructive/10 transition-colors ml-2"
            >
              <LogOut className="size-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}
