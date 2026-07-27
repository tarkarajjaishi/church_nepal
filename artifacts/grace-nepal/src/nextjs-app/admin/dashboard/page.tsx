import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from "@/lib/auth"
import { Link } from 'wouter'
import {
  BookOpen, Calendar, Users, Bell, Image as ImageIcon, Quote, UserCheck, Clock,
  BookMarked, DollarSign, Settings, Shield, ArrowRight, Activity,
  Globe, Briefcase, Star, Mail, Heart, LayoutGrid, CheckCircle2, ChevronRight, XCircle, Plus
} from 'lucide-react'
import { useSettingsSections, useToggleSection } from '@/lib/hooks/settings'
import { useDashboardSermons, useDashboardEvents, useDashboardMinistries, useDashboardNotices, useDashboardLeaders, useDashboardGallery, useDashboardTestimonies, useDashboardMembers, useDashboardServiceTimes, useDashboardVerses, useDashboardCampaigns, useSettings, useUsers } from '@/lib/hooks'

export default function Dashboard() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const { data: sections = {} } = useSettingsSections()
  const { toggleSection } = useToggleSection()
  const sec = sections as Record<string, boolean>

  const sermons = useDashboardSermons()
  const events = useDashboardEvents()
  const ministries = useDashboardMinistries()
  const notices = useDashboardNotices()
  const leaders = useDashboardLeaders()
  const gallery = useDashboardGallery()
  const testimonies = useDashboardTestimonies()
  const members = useDashboardMembers()
  const serviceTimes = useDashboardServiceTimes()
  const verses = useDashboardVerses()
  const campaigns = useDashboardCampaigns()
  const settings = useSettings()
  const users = useUsers()

  const allLoading = [sermons, events, ministries, notices, leaders, gallery, testimonies, members, serviceTimes, verses, campaigns, settings, users].some(q => q.isLoading)

  const totalContent = (sermons.data?.length ?? 0) + (events.data?.length ?? 0) + (ministries.data?.length ?? 0) +
    (leaders.data?.length ?? 0) + (gallery.data?.length ?? 0) + (testimonies.data?.length ?? 0) +
    (notices.data?.length ?? 0) + (members.data?.length ?? 0) + (verses.data?.length ?? 0) +
    (campaigns.data?.length ?? 0) + (serviceTimes.data?.length ?? 0)

  const stats = [
    { label: 'Sermons', value: sermons.data?.length ?? 0, icon: BookOpen, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-l-blue-500', link: '/admin/sermons' },
    { label: 'Events', value: events.data?.length ?? 0, icon: Calendar, color: 'text-green-600', bg: 'bg-green-50', border: 'border-l-green-500', link: '/admin/events' },
    { label: 'Ministries', value: ministries.data?.length ?? 0, icon: Users, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-l-purple-500', link: '/admin/ministries' },
    { label: 'Notices', value: notices.data?.length ?? 0, icon: Bell, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-l-orange-500', link: '/admin/notices' },
    { label: 'Leaders', value: leaders.data?.length ?? 0, icon: UserCheck, color: 'text-teal-600', bg: 'bg-teal-50', border: 'border-l-teal-500', link: '/admin/leaders' },
    { label: 'Gallery', value: gallery.data?.length ?? 0, icon: ImageIcon, color: 'text-pink-600', bg: 'bg-pink-50', border: 'border-l-pink-500', link: '/admin/gallery' },
    { label: 'Members', value: members.data?.length ?? 0, icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-l-indigo-500', link: '/admin/members' },
    { label: 'Campaigns', value: campaigns.data?.length ?? 0, icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-l-emerald-500', link: '/admin/campaigns' },
  ]

  const contentSections = [
    { label: 'Recent Sermons', count: sermons.data?.length ?? 0, icon: BookOpen, color: 'text-blue-600', bg: 'bg-blue-50', link: '/admin/sermons', items: sermons.data?.slice(0, 3) ?? [], renderItem: (s: any) => ({ title: s.title, sub: `${s.speaker} • ${new Date(s.date).toLocaleDateString()}` }) },
    { label: 'Upcoming Events', count: events.data?.length ?? 0, icon: Calendar, color: 'text-green-600', bg: 'bg-green-50', link: '/admin/events', items: events.data?.slice(0, 3) ?? [], renderItem: (e: any) => ({ title: e.title, sub: `${e.date} • ${e.location}` }) },
    { label: 'Active Notices', count: notices.data?.length ?? 0, icon: Bell, color: 'text-orange-600', bg: 'bg-orange-50', link: '/admin/notices', items: notices.data?.slice(0, 3) ?? [], renderItem: (n: any) => ({ title: n.title, sub: n.date ? new Date(n.date).toLocaleDateString() : 'No date' }) },
  ]

  if (allLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-48 bg-slate-200 rounded-2xl w-full"></div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
          {[...Array(8)].map((_, i) => <div key={i} className="h-28 bg-slate-200 rounded-2xl"></div>)}
        </div>
        <div className="h-[400px] bg-slate-200 rounded-2xl w-full"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="bg-[#0b3c5d] rounded-3xl p-8 lg:p-10 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-1/2 h-full bg-gradient-to-l from-white/10 to-transparent pointer-events-none" />
        <div className="relative z-10">
          <h1 className="text-3xl lg:text-4xl font-bold font-serif mb-3 tracking-tight">
            Welcome to Grace Nepal, {user?.name?.split(' ')[0] || 'Admin'}
          </h1>
          <p className="text-sky-200 text-lg max-w-2xl font-medium leading-relaxed">
            Your church's digital home is running smoothly. Here is what is happening today.
          </p>
          
          <div className="flex flex-wrap items-center gap-4 mt-8">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl px-6 py-4 border border-white/10 shadow-sm">
              <div className="text-3xl font-bold text-white mb-1 tracking-tight">{totalContent}</div>
              <div className="text-[11px] text-sky-300 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="size-3.5" /> Total Records
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl px-6 py-4 border border-white/10 shadow-sm">
              <div className="text-3xl font-bold text-white mb-1 tracking-tight">{users.data?.length ?? 0}</div>
              <div className="text-[11px] text-sky-300 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Shield className="size-3.5" /> Admin Users
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
        {stats.map(({ label, value, icon: Icon, color, bg, border, link }) => (
          <Link key={label} href={link} className="block group">
            <div className={`bg-white rounded-2xl shadow-sm border border-slate-200 p-5 hover:shadow-md transition-all duration-200 h-full border-l-4 ${border} hover:-translate-y-1`}>
              <div className={`size-10 rounded-xl ${bg} ${color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <Icon className="size-5" />
              </div>
              <div className="text-2xl font-bold text-slate-900 tracking-tight">{value}</div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">{label}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* Homepage Visibility Controls */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-8 py-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
          <div className="flex items-center gap-4">
            <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-100">
              <LayoutGrid className="size-6 text-[#0b3c5d]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Homepage Visibility</h2>
              <p className="text-sm text-slate-500 font-medium mt-0.5">Control which sections appear on your public site</p>
            </div>
          </div>
        </div>
        <div className="p-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[
              { key: 'hero', apiKey: 'hero', label: 'Hero Section', icon: Star },
              { key: 'serviceTimes', apiKey: 'service_times', label: 'Service Times', icon: Clock },
              { key: 'whatToExpect', apiKey: 'what_to_expect', label: 'What to Expect', icon: Heart },
              { key: 'welcome', apiKey: 'welcome', label: 'Welcome Note', icon: UserCheck },
              { key: 'whatWeBelieve', apiKey: 'what_we_believe', label: 'What We Believe', icon: BookOpen },
              { key: 'watchOnline', apiKey: 'watch_online', label: 'Watch Online', icon: Activity },
              { key: 'prayerCta', apiKey: 'prayer_cta', label: 'Prayer CTA', icon: Heart },
              { key: 'sermons', apiKey: 'sermons', label: 'Sermons', icon: BookOpen },
              { key: 'ministries', apiKey: 'ministries', label: 'Ministries', icon: Users },
              { key: 'events', apiKey: 'events', label: 'Events', icon: Calendar },
              { key: 'notices', apiKey: 'notices', label: 'Notices', icon: Bell },
              { key: 'testimonies', apiKey: 'testimonies', label: 'Testimonies', icon: Quote },
              { key: 'leaders', apiKey: 'leaders', label: 'Leaders', icon: Shield },
              { key: 'gallery', apiKey: 'gallery', label: 'Gallery', icon: ImageIcon },
              { key: 'members', apiKey: 'members', label: 'Members', icon: Users },
              { key: 'verses', apiKey: 'verses', label: 'Verses', icon: BookMarked },
              { key: 'campaigns', apiKey: 'campaigns', label: 'Campaigns', icon: DollarSign },
            ].map(({ key, apiKey, label, icon: Icon }) => {
              const enabled = sec[key] === true
              return (
                <button
                  key={key}
                  onClick={() => toggleSection(apiKey, {
                    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["settings", "sections"] }),
                  })}
                  className={`group relative flex items-center justify-between p-4.5 rounded-2xl border-2 transition-all duration-200 text-left ${
                    enabled
                      ? 'border-green-200 bg-green-50/50 hover:border-green-300 shadow-sm'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <Icon className={`size-5 ${enabled ? 'text-green-600' : 'text-slate-400'}`} />
                    <span className={`text-sm font-bold ${enabled ? 'text-green-900' : 'text-slate-700'}`}>{label}</span>
                  </div>
                  <div className={`flex items-center justify-center size-5 rounded-full transition-colors ${enabled ? 'bg-green-500 text-white' : 'bg-slate-200 text-transparent group-hover:text-slate-400'}`}>
                    {enabled ? <CheckCircle2 className="size-5" /> : <XCircle className="size-5" />}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Content Overview */}
      <div className="grid xl:grid-cols-3 gap-6">
        {contentSections.map(({ label, count, icon: Icon, color, bg, link, items, renderItem }) => (
          <div key={label} className="bg-white rounded-3xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`size-10 rounded-xl ${bg} ${color} flex items-center justify-center`}>
                  <Icon className="size-5" />
                </div>
                <div>
                  <h2 className="font-bold text-slate-900 leading-tight">{label}</h2>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{count} Total</span>
                </div>
              </div>
              <Link href={link} className="p-2 text-slate-400 hover:text-[#0b3c5d] hover:bg-slate-50 rounded-lg transition-colors">
                <Plus className="size-5" />
              </Link>
            </div>
            <div className="flex-1 p-3">
              {items.length > 0 ? (
                <div className="space-y-1">
                  {items.map((item: any, i: number) => {
                    const rendered = renderItem(item)
                    return (
                      <div key={item.id || i} className="p-4 rounded-2xl hover:bg-slate-50 transition-colors flex items-center gap-4 border border-transparent hover:border-slate-100">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-bold text-slate-900 truncate">{rendered.title}</div>
                          <div className="text-xs font-semibold text-slate-500 mt-1 truncate">{rendered.sub}</div>
                        </div>
                        <ChevronRight className="size-4 text-slate-300" />
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center py-12 text-center">
                  <div className="size-12 rounded-full bg-slate-50 flex items-center justify-center mb-3">
                    <Activity className="size-5 text-slate-300" />
                  </div>
                  <p className="text-sm font-semibold text-slate-500">No {label.toLowerCase()} yet</p>
                </div>
              )}
            </div>
            <div className="p-4 border-t border-slate-100 bg-slate-50/50">
              <Link href={link} className="flex items-center justify-center gap-2 text-sm font-bold text-[#0b3c5d] hover:text-[#1f6f8b] transition-colors w-full py-2.5 bg-white border-2 border-slate-200 rounded-xl hover:border-[#0b3c5d]">
                View All <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* User Management Preview */}
      {users.data && users.data.length > 0 && (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-4">
              <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-100">
                <Shield className="size-6 text-[#0b3c5d]" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">System Users</h2>
                <p className="text-sm text-slate-500 font-medium mt-0.5">{users.data.length} active administrators</p>
              </div>
            </div>
            <Link href="/admin/users" className="hidden sm:flex items-center gap-2 text-sm font-bold text-[#0b3c5d] hover:text-[#1f6f8b] px-5 py-2.5 bg-white border-2 border-slate-200 rounded-xl hover:border-[#0b3c5d] transition-colors">
              Manage Users
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white border-b border-slate-200">
                  <th className="px-8 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Name</th>
                  <th className="px-8 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Email</th>
                  <th className="px-8 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {users.data.slice(0, 5).map((u: any) => (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="size-10 rounded-full bg-[#0b3c5d]/10 text-[#0b3c5d] flex items-center justify-center font-bold text-sm">
                          {u.name?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <span className="text-sm font-bold text-slate-900">{u.name}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-sm font-semibold text-slate-500">{u.email}</td>
                    <td className="px-8 py-5">
                      <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider ${
                        u.role === 'admin' ? 'bg-[#0b3c5d] text-white shadow-sm' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
