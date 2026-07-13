import { Outlet, Link, useLocation, useNavigate } from 'react-router'
import { useAuth } from '../lib/auth'
import { LayoutDashboard, BookOpen, Calendar, Users, Image, Quote, Bell, UserCheck, Clock, Bible, DollarSign, Settings, LogOut, Church, Shield } from 'lucide-react'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { divider: true, label: 'Content' },
  { to: '/sermons', icon: BookOpen, label: 'Sermons' },
  { to: '/events', icon: Calendar, label: 'Events' },
  { to: '/ministries', icon: Users, label: 'Ministries' },
  { to: '/leaders', icon: UserCheck, label: 'Leaders' },
  { to: '/gallery', icon: Image, label: 'Gallery' },
  { to: '/testimonies', icon: Quote, label: 'Testimonies' },
  { to: '/notices', icon: Bell, label: 'Notices' },
  { to: '/members', icon: Users, label: 'Members' },
  { to: '/service-times', icon: Clock, label: 'Service Times' },
  { to: '/verses', icon: Bible, label: 'Verses' },
  { to: '/campaigns', icon: DollarSign, label: 'Campaigns' },
  { divider: true, label: 'Management' },
  { to: '/users', icon: Shield, label: 'User Management' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

export function Layout() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-[#0b3c5d] text-white flex flex-col shrink-0">
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Church className="size-6 text-[#d4a843]" />
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
            const { to, icon: Icon, label } = item as { to: string; icon: any; label: string }
            return (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                  location.pathname === to
                    ? 'bg-white/15 text-white'
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon className="size-4" />
                {label}
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

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
