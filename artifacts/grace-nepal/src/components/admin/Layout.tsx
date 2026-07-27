import { useState, useEffect } from 'react'
import { Link } from 'wouter'
import { usePathname } from '@/lib/navigation'
import { useAuth } from '@/lib/auth'
import { LayoutDashboard, BookOpen, Calendar, Users, Image, Quote, Bell, UserCheck, Clock, BookMarked, DollarSign, Settings, LogOut, Church, Shield, LayoutGrid, Heart, CheckSquare, UserCircle, Newspaper, Briefcase, Globe, Mail, Contact, Palette, Receipt, HandHelping, TrendingUp, Wallet, Target, ClipboardCheck, Radio, FileText, BarChart3, HandHeart, MessageSquare, Menu, X, ChevronRight } from 'lucide-react'

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
  { to: '/admin/prayer-requests', icon: HandHeart, label: 'Prayer Requests' },
  { to: '/admin/contact-messages', icon: MessageSquare, label: 'Contact Messages' },
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
  { to: '/admin/rsvps', icon: Users, label: 'Event RSVPs' },
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
  const [mobileOpen, setMobileOpen] = useState(false)

  // Close mobile drawer on path change
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  const handleLogout = () => {
    logout()
    window.location.href = '/admin/login'
  }

  const breadcrumbs = pathname.split('/').filter(Boolean)

  const NavContent = () => (
    <>
      <div className="p-6 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-white/10 p-2 rounded-xl">
            <Church className="size-6 text-gold" />
          </div>
          <div>
            <div className="font-bold text-white tracking-wide">Grace Nepal</div>
            <div className="text-[11px] font-bold text-[#7fb2e0] uppercase tracking-wider mt-0.5">Admin Platform</div>
          </div>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto py-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent" aria-label="Admin navigation">
        {navItems.map((item, i) => {
          if ('divider' in item && item.divider) {
            return (
              <div key={i} className="px-6 pt-6 pb-2">
                <div className="text-[11px] font-bold text-white/40 uppercase tracking-wider">{item.label}</div>
              </div>
            )
          }
          const nav = item as { to: string; icon: any; label: string }
          const isActive = pathname === nav.to || pathname.startsWith(nav.to + '/')
          return (
            <Link
              key={nav.to}
              href={nav.to}
              className={`flex items-center gap-3 px-6 py-2.5 text-sm font-semibold transition-all relative ${
                isActive ? 'bg-white text-[#0b3c5d]' : 'text-white/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              {isActive && (
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gold rounded-r-full shadow-[0_0_8px_rgba(212,160,23,0.6)]" />
              )}
              <nav.icon className={`size-4.5 ${isActive ? 'text-[#0b3c5d]' : 'text-white/50'}`} />
              {nav.label}
            </Link>
          )
        })}
      </nav>
      <div className="p-4 border-t border-white/10 shrink-0">
        <div className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/5 hover:bg-white/10 transition-colors">
          <div className="size-10 rounded-full bg-[#1f6f8b] flex items-center justify-center font-bold text-white shadow-inner shrink-0">
            {user?.name?.[0]?.toUpperCase() || 'A'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold text-white truncate">{user?.name || 'Admin'}</div>
            <div className="text-[11px] font-medium text-white/50 truncate">{user?.email || 'admin@gracenepal.org'}</div>
          </div>
          <button 
            onClick={handleLogout} 
            className="p-2 text-white/50 hover:text-white hover:bg-white/20 rounded-lg transition-colors shrink-0"
            aria-label="Log out"
            title="Log out"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </div>
    </>
  )

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-[260px] bg-[#0b3c5d] text-white flex-col shrink-0 shadow-xl z-20">
        <NavContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-slate-900/60 z-40 lg:hidden backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
      )}

      {/* Mobile Sidebar Drawer */}
      <aside className={`fixed inset-y-0 left-0 w-[260px] bg-[#0b3c5d] text-white flex flex-col z-50 transform transition-transform duration-300 ease-in-out lg:hidden shadow-2xl ${
        mobileOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <button onClick={() => setMobileOpen(false)} className="absolute top-6 right-4 text-white/50 hover:text-white p-2">
          <X className="size-5" />
        </button>
        <NavContent />
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-8 shrink-0 z-10 shadow-sm relative">
          <div className="flex items-center gap-4">
            <button className="lg:hidden p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors" onClick={() => setMobileOpen(true)}>
              <Menu className="size-5" />
            </button>
            <div className="hidden sm:flex items-center text-sm font-semibold text-slate-500">
              <Link href="/admin/dashboard" className="hover:text-slate-900 transition-colors">Admin</Link>
              {breadcrumbs.slice(1).map((crumb, i) => (
                <div key={i} className="flex items-center">
                  <ChevronRight className="size-4 mx-1.5 text-slate-300" />
                  <span className="capitalize text-slate-900">{crumb.replace(/-/g, ' ')}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-5">
            <button className="text-slate-400 hover:text-[#0b3c5d] relative transition-colors p-2 rounded-full hover:bg-slate-100">
              <Bell className="size-5" />
              <span className="absolute top-1.5 right-1.5 size-2.5 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="h-8 w-px bg-slate-200 hidden sm:block"></div>
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <div className="text-sm font-bold text-slate-900 leading-none mb-1">{user?.name || 'Admin User'}</div>
                <div className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">{user?.role === 'admin' ? 'Administrator' : 'Editor'}</div>
              </div>
              <div className="size-9 rounded-full bg-slate-100 text-[#0b3c5d] flex items-center justify-center font-bold text-sm border border-slate-200 shadow-sm">
                {user?.name?.[0]?.toUpperCase() || 'A'}
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto bg-slate-50 p-4 sm:p-8">
          <div className="max-w-7xl mx-auto pb-12">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
