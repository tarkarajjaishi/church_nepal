'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import {
  LayoutDashboard, CalendarRange, Users, Music, CalendarClock,
  ChevronLeft, Menu, X,
} from 'lucide-react'

/**
 * Worship module shell.
 *
 * Song Library links across to the presentation module rather than duplicating
 * it: a church has one song catalogue, and two would drift the moment someone
 * edited a key in the wrong place.
 */
const NAV = [
  {
    group: 'Plan',
    items: [
      { href: '/admin/worship', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/admin/worship/services', label: 'Service Plans', icon: CalendarRange },
      { href: '/admin/worship/rehearsals', label: 'Rehearsals', icon: CalendarClock },
    ],
  },
  {
    group: 'People & Music',
    items: [
      { href: '/admin/worship/team', label: 'Worship Team', icon: Users },
      { href: '/admin/presentation/songs', label: 'Song Library', icon: Music, external: true },
    ],
  },
]

export default function WorshipLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  const isActive = (href: string) =>
    href === '/admin/worship' ? pathname === href : pathname.startsWith(href)

  const nav = (
    <nav className="space-y-6" aria-label="Worship management">
      {NAV.map(({ group, items }) => (
        <div key={group}>
          <p className="px-3 mb-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/70">
            {group}
          </p>
          <ul className="space-y-0.5">
            {items.map((item) => {
              const active = !item.external && isActive(item.href)
              const Icon = item.icon
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    aria-current={active ? 'page' : undefined}
                    className={`flex items-center gap-2.5 min-h-10 px-3 rounded-lg text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                      active ? 'bg-primary/10 text-primary font-medium'
                             : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                  >
                    <Icon className="size-4 shrink-0" aria-hidden />
                    <span className="truncate">{item.label}</span>
                    {item.external && (
                      <span className="ml-auto text-[10px] text-muted-foreground/60 shrink-0">shared</span>
                    )}
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
            <h2 className="px-3 font-semibold text-foreground">Worship</h2>
            <p className="px-3 text-xs text-muted-foreground mt-0.5">Services &amp; team</p>
          </div>
          {nav}
        </div>
      </aside>

      <div className="lg:hidden">
        <button type="button" onClick={() => setOpen(true)} aria-expanded={open}
          className="inline-flex items-center gap-2 min-h-11 px-3 rounded-xl border border-border bg-card text-sm font-medium hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <Menu className="size-4" aria-hidden />
          Worship menu
        </button>
        {open && (
          <div className="fixed inset-0 z-50 flex">
            <button type="button" className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={() => setOpen(false)} aria-label="Close menu" />
            <div className="relative w-[min(85vw,20rem)] h-full overflow-y-auto bg-card border-r border-border p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold">Worship</h2>
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
