'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { LayoutDashboard, BookOpen, Calendar, Users, Image, Quote, Bell, UserCheck, Clock, BookMarked, DollarSign, Settings, LogOut, Church, Shield, LayoutGrid, Heart, CheckSquare, UserCircle, Newspaper, Briefcase, Globe, Mail, Contact, Palette, Receipt, HandHelping, TrendingUp, Wallet, Target, ClipboardCheck, Radio, FileText, BarChart3 } from 'lucide-react'

const navItems = [
  { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/content-blocks', icon: LayoutGrid, label: 'Homepage Sections' },
  { divider: true, label: 'Content' },
  { to: '/admin/sermons', icon: BookOpen, label: 'Sermons' },
  { to: '/admin/events', icon: Calendar, label: 'Events' },
  { to: '/admin/ministries', icon: Users, label: 'Ministries' },
  { to: '/admin/groups', icon: Users, label: 'Groups' },
  { to: '/admin/leaders', icon: UserCheck, label: 'Leaders' },
  { to: '/admin/gallery', icon: Image, label: 'Gallery' },
  { to: '/admin/testimonies', icon: Quote, label: 'Testimonies' },
  { to: '/admin/notices', icon: Bell, label: 'Notices' },
  { to: '/admin/members', icon: Users, label: 'Members' },
  { to: '/admin/service-times', icon: Clock, label: 'Service Times' },
  { to: '/admin/verses', icon: BookMarked, label: 'Verses' },
  { divider: true, label: 'CRM & Finance' },
  { to: '/admin/people', icon: Users, label: 'People' },
  { to: '/admin/offerings', icon: DollarSign, label: 'Offerings' },
  { to: '/admin/giving', icon: Receipt, label: 'Giving Dashboard' },
  { to: '/admin/funds', icon: Wallet, label: 'Funds' },
  { to: '/admin/campaigns', icon: Target, label: 'Campaigns' },
  { to: '/admin/pledges', icon: Target, label: 'Pledges' },
  { to: '/admin/donations', icon: Heart, label: 'Donations' },
  { to: '/admin/member-applications', icon: Users, label: 'Member Applications' },
  { to: '/admin/todos', icon: CheckSquare, label: 'Todos' },
  { divider: true, label: 'Operations' },
  { to: '/admin/attendance', icon: ClipboardCheck, label: 'Attendance' },
  { to: '/admin/volunteers', icon: HandHelping, label: 'Volunteers' },
  { to: '/admin/broadcasts', icon: Radio, label: 'Broadcasts' },
  { to: '/admin/forms', icon: FileText, label: 'Forms' },
  { divider: true, label: 'Website CMS' },
  { to: '/admin/images', icon: Image, label: 'Image Manager' },
  { to: '/admin/blog', icon: Newspaper, label: 'Blog Posts' },
  { to: '/admin/team', icon: UserCheck, label: 'Team Members' },
  { to: '/admin/services', icon: Briefcase, label: 'Services' },
  { to: '/admin/portfolio', icon: Globe, label: 'Portfolio' },
  { to: '/admin/contact-info', icon: Contact, label: 'Contact Info' },
  { to: '/admin/newsletter', icon: Mail, label: 'Newsletter' },
  { divider: true, label: 'Management' },
  { to: '/admin/reports', icon: BarChart3, label: 'Reports' },
  { to: '/admin/audit-log', icon: Shield, label: 'Audit Log' },
  { to: '/admin/users', icon: Shield, label: 'Users' },
  { to: '/admin/theme', icon: Palette, label: 'Theme & Layout' },
  { to: '/admin/settings', icon: Settings, label: 'Settings' },
  { to: '/admin/profile', icon: UserCircle, label: 'Profile' },
]

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth()
  const pathname = usePathname()

  const handleLogout = () => {
    logout()
    window.location.href = '/admin/login'
  }

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
        <nav className="flex-1 overflow-y-auto py-2">
          {navItems.map((item, i) => {
            if ('divider' in item && item.divider) {
              return (
                <div key={i} className="px-4 pt-4 pb-1">
                  <div className="text-[10px] font-semibold text-white/40 uppercase tracking-wider">{item.label}</div>
                </div>
              )
            }
            const nav = item as { to: string; icon: any; label: string }
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
          <div className="text-sm text-white/70 mb-2">{user?.name}</div>
          <button onClick={handleLogout} className="flex items-center gap-2 text-sm text-white/60 hover:text-white">
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
