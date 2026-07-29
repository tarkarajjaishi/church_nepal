'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import {
  LayoutDashboard,
  ReceiptText,
  PlusCircle,
  Calculator,
  Landmark,
  Users,
  Repeat,
  Target,
  Wallet,
  Building2,
  FileText,
  BarChart3,
  Settings,
  ChevronLeft,
  Menu,
  X,
} from 'lucide-react'

/**
 * Offering Management module shell.
 *
 * A second-level sidebar rather than more entries in the global admin nav:
 * that nav is already a flat list of ~45 links, and adding 14 more would make
 * it unusable. Grouping the module keeps finance work in one place and gives
 * the section its own sense of place.
 */

const NAV = [
  {
    group: 'Overview',
    items: [
      { href: '/admin/offering-management', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/admin/offering-management/offerings', label: 'Offerings', icon: ReceiptText },
      { href: '/admin/offering-management/new', label: 'Quick Add', icon: PlusCircle },
    ],
  },
  {
    group: 'Counting & Banking',
    items: [
      { href: '/admin/offering-management/cash-counting', label: 'Cash Counting', icon: Calculator },
      { href: '/admin/offering-management/deposits', label: 'Deposits', icon: Landmark },
      { href: '/admin/offering-management/bank-accounts', label: 'Bank Accounts', icon: Building2 },
    ],
  },
  {
    group: 'Giving',
    items: [
      { href: '/admin/offering-management/donors', label: 'Donors', icon: Users },
      { href: '/admin/offering-management/recurring', label: 'Recurring Giving', icon: Repeat },
      { href: '/admin/offering-management/campaigns', label: 'Campaigns', icon: Target },
    ],
  },
  {
    group: 'Finance',
    items: [
      { href: '/admin/offering-management/funds', label: 'Funds', icon: Wallet },
      { href: '/admin/offering-management/receipts', label: 'Receipts', icon: FileText },
      { href: '/admin/offering-management/reports', label: 'Financial Reports', icon: FileText },
      { href: '/admin/offering-management/analytics', label: 'Analytics', icon: BarChart3 },
    ],
  },
  {
    group: 'Configure',
    items: [
      { href: '/admin/offering-management/settings', label: 'Settings', icon: Settings },
    ],
  },
]

export default function OfferingManagementLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  const isActive = (href: string) =>
    href === '/admin/offering-management'
      ? pathname === href
      : pathname.startsWith(href)

  const nav = (
    <nav className="space-y-6" aria-label="Offering management">
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
      {/* Desktop rail */}
      <aside className="hidden lg:block w-60 shrink-0">
        <div className="sticky top-4 space-y-4">
          <Link
            href="/admin/dashboard"
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="size-3.5" aria-hidden />
            Back to admin
          </Link>
          <div>
            <h2 className="px-3 font-semibold text-foreground">Offering Management</h2>
            <p className="px-3 text-xs text-muted-foreground mt-0.5">
              Giving, counting &amp; banking
            </p>
          </div>
          {nav}
        </div>
      </aside>

      {/* Mobile trigger + drawer */}
      <div className="lg:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 min-h-11 px-3 rounded-xl border border-border bg-card text-sm font-medium hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-expanded={open}
        >
          <Menu className="size-4" aria-hidden />
          Offering menu
        </button>
        {open && (
          <div className="fixed inset-0 z-50 flex">
            <button
              type="button"
              className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
            />
            <div className="relative w-[min(85vw,20rem)] h-full overflow-y-auto bg-card border-r border-border p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold">Offering Management</h2>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="inline-flex items-center justify-center size-11 rounded-lg hover:bg-muted transition-colors"
                  aria-label="Close menu"
                >
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
