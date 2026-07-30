'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import {
  LayoutDashboard, Package, Wrench, CalendarCheck, ArrowLeftRight,
  Truck, Tags, ChevronLeft, Menu, X,
} from 'lucide-react'

const NAV = [
  {
    group: 'Inventory',
    items: [
      { href: '/admin/assets', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/admin/assets/register', label: 'Assets', icon: Package },
    ],
  },
  {
    group: 'Movement',
    items: [
      { href: '/admin/assets/assignments', label: 'Check-out', icon: ArrowLeftRight },
      { href: '/admin/assets/reservations', label: 'Reservations', icon: CalendarCheck },
      { href: '/admin/assets/maintenance', label: 'Maintenance', icon: Wrench },
    ],
  },
  {
    group: 'Configure',
    items: [
      { href: '/admin/assets/categories', label: 'Categories', icon: Tags },
      { href: '/admin/assets/suppliers', label: 'Suppliers', icon: Truck },
    ],
  },
]

export default function AssetsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  const isActive = (href: string) =>
    href === '/admin/assets' ? pathname === href : pathname.startsWith(href)

  const nav = (
    <nav className="space-y-6" aria-label="Asset management">
      {NAV.map(({ group, items }) => (
        <div key={group}>
          <p className="px-3 mb-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/70">
            {group}
          </p>
          <ul className="space-y-0.5">
            {items.map(({ href, label, icon: Icon }) => {
              const active = isActive(href)
              return (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={() => setOpen(false)}
                    aria-current={active ? 'page' : undefined}
                    className={`flex items-center gap-2.5 min-h-10 px-3 rounded-lg text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                      active
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                  >
                    <Icon className="size-4 shrink-0" aria-hidden />
                    <span className="truncate">{label}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </nav>
  )

  return (
    <div className="flex gap-6">
      <aside className="hidden lg:block w-56 shrink-0">
        <div className="sticky top-4 space-y-4">
          <Link href="/admin/dashboard" className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
            <ChevronLeft className="size-3.5" aria-hidden />
            Back to admin
          </Link>
          <div>
            <h2 className="px-3 font-semibold text-foreground">Assets</h2>
            <p className="px-3 text-xs text-muted-foreground mt-0.5">Inventory &amp; upkeep</p>
          </div>
          {nav}
        </div>
      </aside>

      <div className="lg:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-expanded={open}
          className="inline-flex items-center gap-2 min-h-11 px-3 rounded-xl border border-border bg-card text-sm font-medium hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Menu className="size-4" aria-hidden />
          Asset menu
        </button>
        {open && (
          <div className="fixed inset-0 z-50 flex">
            <button type="button" className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={() => setOpen(false)} aria-label="Close menu" />
            <div className="relative w-[min(85vw,20rem)] h-full overflow-y-auto bg-card border-r border-border p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold">Assets</h2>
                <button type="button" onClick={() => setOpen(false)} className="inline-flex items-center justify-center size-11 rounded-lg hover:bg-muted transition-colors" aria-label="Close menu">
                  <X className="size-5" aria-hidden />
                </button>
              </div>
              {nav}
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">{children}</div>
    </div>
  )
}
