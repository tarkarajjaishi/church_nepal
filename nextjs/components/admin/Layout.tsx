'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { useAccess } from '@/lib/roles/useAccess'
import { LayoutDashboard, BookOpen, Calendar, Users, Image, Quote, Bell, UserCheck, Clock, BookMarked, DollarSign, Settings, LogOut, Church, Shield, LayoutGrid, Heart, CheckSquare, UserCircle, Newspaper, Briefcase, Globe, Mail, Contact, Palette, Receipt, HandHelping, TrendingUp, Wallet, Target, ClipboardCheck, Radio, FileText, BarChart3, HandHeart, MessageSquare, MonitorPlay, Music, Package, Library, LifeBuoy, KeyRound } from 'lucide-react'

type NavLink = { to: string; icon: React.ElementType; label: string; perm?: string }
type NavDivider = { divider: true; label: string }
type NavEntry = NavLink | NavDivider

const isDivider = (e: NavEntry): e is NavDivider => 'divider' in e

const navItems: NavEntry[] = [
  { to: '/admin/overview', icon: Church, label: 'Church Overview' , perm: 'dashboard.view' },
  { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' , perm: 'dashboard.view' },
  { to: '/admin/todos', icon: CheckSquare, label: 'Todos', perm: 'dashboard.view' },
  { to: '/admin/content-blocks', icon: LayoutGrid, label: 'Homepage Sections' , perm: 'content.manage' },
  { divider: true, label: 'Content' },
  { to: '/admin/sermons', icon: BookOpen, label: 'Sermons' , perm: 'content.manage' },
  { to: '/admin/events', icon: Calendar, label: 'Events' , perm: 'content.manage' },
  { to: '/admin/ministries', icon: Users, label: 'Ministries' , perm: 'content.manage' },
  { to: '/admin/groups', icon: Users, label: 'Groups' , perm: 'people.view' },
  { to: '/admin/leaders', icon: UserCheck, label: 'Leaders' , perm: 'content.manage' },
  { to: '/admin/gallery', icon: Image, label: 'Gallery' , perm: 'content.manage' },
  { to: '/admin/testimonies', icon: Quote, label: 'Testimonies' , perm: 'content.manage' },
  { to: '/admin/notices', icon: Bell, label: 'Notices' , perm: 'content.manage' },
  { to: '/admin/members', icon: Users, label: 'Members' , perm: 'people.view' },
  { to: '/admin/service-times', icon: Clock, label: 'Service Times' , perm: 'content.manage' },
  { to: '/admin/verses', icon: BookMarked, label: 'Verses' , perm: 'content.manage' },
  { divider: true, label: 'CRM & Finance' },
  { to: '/admin/people', icon: Users, label: 'People' , perm: 'people.view' },
  { to: '/admin/prayer-requests', icon: HandHeart, label: 'Prayer Requests' , perm: 'communication.manage' },
  { to: '/admin/contact-messages', icon: MessageSquare, label: 'Contact Messages' , perm: 'communication.manage' },
  { to: '/admin/worship', icon: Music, label: 'Worship' , perm: 'worship.manage' },
  { to: '/admin/presentation', icon: MonitorPlay, label: 'Presentation' , perm: 'presentation.manage' },
  { to: '/admin/offering-management', icon: DollarSign, label: 'Offering Management' , perm: 'giving.view' },
  { to: '/admin/offerings', icon: DollarSign, label: 'Offerings (legacy)' , perm: 'giving.view' },
  { to: '/admin/giving', icon: Receipt, label: 'Giving Dashboard' , perm: 'giving.view' },
  { to: '/admin/funds', icon: Wallet, label: 'Funds' , perm: 'giving.view' },
  { to: '/admin/campaigns', icon: Target, label: 'Campaigns' , perm: 'giving.view' },
  { to: '/admin/pledges', icon: Target, label: 'Pledges' , perm: 'giving.view' },
  { to: '/admin/donations', icon: Heart, label: 'Donations' , perm: 'giving.view' },
  { to: '/admin/member-applications', icon: Users, label: 'Member Applications' , perm: 'people.view' },
  { divider: true, label: 'Operations' },
  { to: '/admin/assets', icon: Package, label: 'Assets' , perm: 'assets.manage' },
  { to: '/admin/library', icon: Library, label: 'Library' , perm: 'library.manage' },
  { to: '/admin/helpdesk', icon: LifeBuoy, label: 'Help Desk' , perm: 'helpdesk.manage' },
  { to: '/admin/attendance', icon: ClipboardCheck, label: 'Attendance' , perm: 'people.view' },
  { to: '/admin/rsvps', icon: Users, label: 'Event RSVPs' , perm: 'people.view' },
  { to: '/admin/volunteers', icon: HandHelping, label: 'Volunteers' , perm: 'people.view' },
  { to: '/admin/broadcasts', icon: Radio, label: 'Broadcasts' , perm: 'communication.manage' },
  { to: '/admin/forms', icon: FileText, label: 'Forms' , perm: 'communication.manage' },
  { divider: true, label: 'Website CMS' },
  { to: '/admin/images', icon: Image, label: 'Image Manager' , perm: 'content.manage' },
  { to: '/admin/blog', icon: Newspaper, label: 'Blog Posts' , perm: 'content.manage' },
  { to: '/admin/team', icon: UserCheck, label: 'Team Members' , perm: 'content.manage' },
  { to: '/admin/services', icon: Briefcase, label: 'Services' , perm: 'content.manage' },
  { to: '/admin/portfolio', icon: Globe, label: 'Portfolio' , perm: 'content.manage' },
  { to: '/admin/contact-info', icon: Contact, label: 'Contact Info' , perm: 'content.manage' },
  { to: '/admin/newsletter', icon: Mail, label: 'Newsletter' , perm: 'communication.manage' },
  { divider: true, label: 'Management' },
  { to: '/admin/reports', icon: BarChart3, label: 'Reports' , perm: 'giving.view' },
  { to: '/admin/audit-log', icon: Shield, label: 'Audit Log' , perm: 'audit.view' },
  { to: '/admin/users', icon: Shield, label: 'Users' , perm: 'users.manage' },
  { to: '/admin/roles', icon: KeyRound, label: 'Roles & Permissions', perm: 'users.manage' },
  { to: '/admin/theme', icon: Palette, label: 'Theme & Layout' , perm: 'settings.manage' },
  { to: '/admin/settings', icon: Settings, label: 'Settings' , perm: 'settings.manage' },
  { to: '/admin/profile', icon: UserCircle, label: 'Profile' },
]

/**
 * Drop what this user cannot reach, then drop group headings left with
 * nothing under them.
 *
 * This only decides what is *shown*. Every one of these permissions is checked
 * again by the server on the route itself — a hidden link is a courtesy so
 * nobody is offered a page that will refuse them, never the control.
 */
function visibleNav(entries: NavEntry[], can: (p: string) => boolean): NavEntry[] {
  const allowed = entries.filter((e) => isDivider(e) || !e.perm || can(e.perm))
  return allowed.filter((e, i) => {
    if (!isDivider(e)) return true
    const next = allowed[i + 1]
    return next !== undefined && !isDivider(next)
  })
}

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth()
  const pathname = usePathname()
  const { can, isLoading: accessLoading, unmanaged } = useAccess()

  const handleLogout = () => {
    logout()
    window.location.href = '/admin/login'
  }

  // Until the answer arrives, show only what needs no permission. Hiding a
  // link for a moment is a flicker; showing one is a promise the next click
  // breaks with a 403.
  const items = accessLoading ? navItems.filter((e) => isDivider(e) || !e.perm) : visibleNav(navItems, can)

  return (
    <div className="flex h-screen bg-background">
      <aside className="w-64 bg-church-blue text-white flex flex-col shrink-0">
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Church className="size-6 text-gold" />
            <div>
              <div className="font-bold text-sm">Grace Nepal Church</div>
              <div className="text-[11px] text-white/60">Admin Panel</div>
            </div>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto py-2" aria-label="Admin navigation">
          {items.map((item, i) => {
            if (isDivider(item)) {
              return (
                <div key={i} className="px-4 pt-4 pb-1">
                  <div className="text-[10px] font-semibold text-white/40 uppercase tracking-wider">{item.label}</div>
                </div>
              )
            }
            const nav = item
            const isActive = pathname === nav.to
            return (
              <Link
                key={nav.to}
                href={nav.to}
                className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                  isActive ? 'bg-white/15 text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`}
              >
                <nav.icon className="size-4" />
                {nav.label}
              </Link>
            )
          })}
        </nav>
        <div className="p-4 border-t border-white/10">
          <div className="text-sm text-white/70">{user?.name}</div>
          {/* Says out loud when the signed-in identity is a hand-minted token
              with no user row, where the signed claim governs rather than any
              role. Silent unrestricted access is the wrong kind of quiet. */}
          {unmanaged && (
            <div className="text-[11px] text-gold mb-2">Unmanaged token — full access</div>
          )}
          <div className="mb-2" />
          <button onClick={handleLogout} className="flex items-center gap-2 text-sm text-white/60 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-white" aria-label="Log out">
            <LogOut className="size-4" /> Logout
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto bg-background">
        <div className="p-6">{children}</div>
      </main>
    </div>
  )
}
