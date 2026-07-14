'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from "@/lib/admin/api"
import { useAuth } from "@/lib/admin/auth"
import Link from 'next/link'
import {
  BookOpen, Calendar, Users, Bell, Image, Quote, UserCheck, Clock,
  BookMarked, DollarSign, Settings, Shield, ArrowRight, Activity, Eye, EyeOff
} from 'lucide-react'
import { useSections, useToggleSection } from '@/lib/hooks'

export default function Dashboard() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const { data: sections = {} } = useSections()
  const { toggleSection } = useToggleSection()
  const sec = sections as Record<string, boolean>

  const sermons = useQuery({ queryKey: ['sermons'], queryFn: () => api.get('/sermons').then(r => r.data) })
  const events = useQuery({ queryKey: ['events'], queryFn: () => api.get('/events').then(r => r.data) })
  const ministries = useQuery({ queryKey: ['ministries'], queryFn: () => api.get('/ministries').then(r => r.data) })
  const notices = useQuery({ queryKey: ['notices'], queryFn: () => api.get('/notices').then(r => r.data) })
  const leaders = useQuery({ queryKey: ['leaders'], queryFn: () => api.get('/leaders').then(r => r.data) })
  const gallery = useQuery({ queryKey: ['gallery'], queryFn: () => api.get('/gallery').then(r => r.data) })
  const testimonies = useQuery({ queryKey: ['testimonies'], queryFn: () => api.get('/testimonies').then(r => r.data) })
  const members = useQuery({ queryKey: ['members'], queryFn: () => api.get('/members').then(r => r.data) })
  const serviceTimes = useQuery({ queryKey: ['service-times'], queryFn: () => api.get('/service-times').then(r => r.data) })
  const verses = useQuery({ queryKey: ['verses'], queryFn: () => api.get('/verses').then(r => r.data) })
  const campaigns = useQuery({ queryKey: ['campaigns'], queryFn: () => api.get('/campaigns').then(r => r.data) })
  const settings = useQuery({ queryKey: ['settings'], queryFn: () => api.get('/settings').then(r => r.data) })
  const users = useQuery({ queryKey: ['users'], queryFn: () => api.get('/users').then(r => r.data) })

  const allLoading = [sermons, events, ministries, notices, leaders, gallery, testimonies, members, serviceTimes, verses, campaigns, settings, users].some(q => q.isLoading)

  const totalContent = (sermons.data?.length ?? 0) + (events.data?.length ?? 0) + (ministries.data?.length ?? 0) +
    (leaders.data?.length ?? 0) + (gallery.data?.length ?? 0) + (testimonies.data?.length ?? 0) +
    (notices.data?.length ?? 0) + (members.data?.length ?? 0) + (verses.data?.length ?? 0) +
    (campaigns.data?.length ?? 0) + (serviceTimes.data?.length ?? 0)

  const stats = [
    { label: 'Total Content', value: totalContent, icon: Activity, color: 'bg-[#0b3c5d]', link: null },
    { label: 'Users', value: users.data?.length ?? 0, icon: Shield, color: 'bg-red-500', link: '/users' },
    { label: 'Sermons', value: sermons.data?.length ?? 0, icon: BookOpen, color: 'bg-blue-500', link: '/sermons' },
    { label: 'Events', value: events.data?.length ?? 0, icon: Calendar, color: 'bg-green-500', link: '/events' },
    { label: 'Ministries', value: ministries.data?.length ?? 0, icon: Users, color: 'bg-purple-500', link: '/ministries' },
    { label: 'Notices', value: notices.data?.length ?? 0, icon: Bell, color: 'bg-orange-500', link: '/notices' },
    { label: 'Leaders', value: leaders.data?.length ?? 0, icon: UserCheck, color: 'bg-teal-500', link: '/leaders' },
    { label: 'Gallery', value: gallery.data?.length ?? 0, icon: Image, color: 'bg-pink-500', link: '/gallery' },
    { label: 'Testimonies', value: testimonies.data?.length ?? 0, icon: Quote, color: 'bg-amber-500', link: '/testimonies' },
    { label: 'Members', value: members.data?.length ?? 0, icon: Users, color: 'bg-indigo-500', link: '/members' },
    { label: 'Verses', value: verses.data?.length ?? 0, icon: BookMarked, color: 'bg-rose-500', link: '/verses' },
    { label: 'Campaigns', value: campaigns.data?.length ?? 0, icon: DollarSign, color: 'bg-emerald-500', link: '/campaigns' },
  ]

  const contentSections = [
    { label: 'Sermons', count: sermons.data?.length ?? 0, icon: BookOpen, color: 'bg-blue-500', link: '/sermons', items: sermons.data?.slice(0, 3) ?? [], renderItem: (s: any) => ({ title: s.title, sub: `${s.speaker} · ${s.date}` }) },
    { label: 'Events', count: events.data?.length ?? 0, icon: Calendar, color: 'bg-green-500', link: '/events', items: events.data?.slice(0, 3) ?? [], renderItem: (e: any) => ({ title: e.title, sub: `${e.displayDate} · ${e.location}` }) },
    { label: 'Notices', count: notices.data?.length ?? 0, icon: Bell, color: 'bg-orange-500', link: '/notices', items: notices.data?.slice(0, 3) ?? [], renderItem: (n: any) => ({ title: n.title, sub: `${n.category}${n.urgent ? ' · Urgent' : ''}` }) },
    { label: 'Campaigns', count: campaigns.data?.length ?? 0, icon: DollarSign, color: 'bg-emerald-500', link: '/campaigns', items: campaigns.data?.slice(0, 3) ?? [], renderItem: (c: any) => ({ title: c.title, sub: `Rs ${c.raised?.toLocaleString()} / Rs ${c.goal?.toLocaleString()}` }) },
  ]

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-[#0b3c5d] to-[#0d4a6e] rounded-2xl p-6 text-white">
        <h1 className="text-2xl font-bold">Welcome back, {user?.name || 'Admin'}</h1>
        <p className="text-white/70 mt-1">Here's what's happening with your church website</p>
        <div className="flex items-center gap-4 mt-4">
          <div className="bg-white/10 rounded-lg px-4 py-2">
            <div className="text-2xl font-bold">{totalContent}</div>
            <div className="text-xs text-white/60">Total Items</div>
          </div>
          <div className="bg-white/10 rounded-lg px-4 py-2">
            <div className="text-2xl font-bold">{users.data?.length ?? 0}</div>
            <div className="text-xs text-white/60">Admin Users</div>
          </div>
          <div className="bg-white/10 rounded-lg px-4 py-2">
            <div className="text-2xl font-bold">{settings.data?.length ?? 0}</div>
            <div className="text-xs text-white/60">Settings</div>
          </div>
        </div>
      </div>

      {/* Homepage Visibility Controls */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Eye className="size-5 text-[#0b3c5d]" />
          <h2 className="font-semibold text-[#0b3c5d]">Homepage Visibility</h2>
          <span className="text-xs text-gray-500 ml-2">Control which sections appear on the homepage</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {[
            { key: 'service_times', label: 'Service Times', icon: Clock },
            { key: 'sermons', label: 'Sermons', icon: BookOpen },
            { key: 'ministries', label: 'Ministries', icon: Users },
            { key: 'events', label: 'Events', icon: Calendar },
            { key: 'notices', label: 'Notices', icon: Bell },
            { key: 'testimonies', label: 'Testimonies', icon: Quote },
            { key: 'leaders', label: 'Leaders', icon: UserCheck },
            { key: 'gallery', label: 'Gallery', icon: Image },
            { key: 'members', label: 'Members', icon: Users },
            { key: 'verses', label: 'Verses', icon: BookMarked },
            { key: 'campaigns', label: 'Campaigns', icon: DollarSign },
          ].map(({ key, label, icon: Icon }) => {
            const enabled = sec[key] !== false
            return (
              <button
                key={key}
                onClick={() => toggleSection(key, {
                  onSuccess: () => queryClient.invalidateQueries({ queryKey: ["settings", "sections"] }),
                })}
                className={`flex items-center justify-between p-3 rounded-xl border-2 transition-all hover:shadow-md ${
                  enabled
                    ? 'border-green-200 bg-green-50 hover:border-green-300'
                    : 'border-red-200 bg-red-50 hover:border-red-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon className={`size-4 ${enabled ? 'text-green-600' : 'text-red-500'}`} />
                  <span className="text-sm font-medium text-gray-800">{label}</span>
                </div>
                <div className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${enabled ? 'bg-green-500' : 'bg-gray-300'}`}>
                  <span className={`inline-block size-3.5 transform rounded-full bg-white transition-transform shadow ${enabled ? 'translate-x-4.5' : 'translate-x-0.5'}`} />
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {allLoading ? (
        <div className="text-center py-12 text-gray-500">Loading dashboard...</div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {stats.map(({ label, value, icon: Icon, color, link }) => (
              <div key={label} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow">
                {link ? (
                  <Link href={link} className="flex items-center gap-3">
                    <div className={`size-10 rounded-lg ${color} flex items-center justify-center text-white shrink-0`}>
                      <Icon className="size-5" />
                    </div>
                    <div>
                      <div className="text-xl font-bold text-gray-900">{value}</div>
                      <div className="text-xs text-gray-500">{label}</div>
                    </div>
                  </Link>
                ) : (
                  <div className="flex items-center gap-3">
                    <div className={`size-10 rounded-lg ${color} flex items-center justify-center text-white shrink-0`}>
                      <Icon className="size-5" />
                    </div>
                    <div>
                      <div className="text-xl font-bold text-gray-900">{value}</div>
                      <div className="text-xs text-gray-500">{label}</div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h2 className="font-semibold text-[#0b3c5d] mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
              {[
                { label: 'Add Sermon', icon: BookOpen, link: '/sermons', color: 'bg-blue-500' },
                { label: 'Add Event', icon: Calendar, link: '/events', color: 'bg-green-500' },
                { label: 'Add Notice', icon: Bell, link: '/notices', color: 'bg-orange-500' },
                { label: 'Add User', icon: Shield, link: '/users', color: 'bg-red-500' },
                { label: 'Manage Gallery', icon: Image, link: '/gallery', color: 'bg-pink-500' },
                { label: 'Settings', icon: Settings, link: '/settings', color: 'bg-gray-500' },
              ].map(({ label, icon: Icon, link, color }) => (
                <Link
                  key={label}
                  href={link}
                  className="flex items-center gap-2 px-4 py-3 rounded-lg border border-gray-200 hover:border-[#0b3c5d] hover:bg-[#0b3c5d]/5 transition-all"
                >
                  <div className={`size-8 rounded-lg ${color} flex items-center justify-center text-white shrink-0`}>
                    <Icon className="size-4" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">{label}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Content Overview */}
          <div className="grid lg:grid-cols-2 gap-6">
            {contentSections.map(({ label, count, icon: Icon, color, link, items, renderItem }) => (
              <div key={label} className="bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`size-8 rounded-lg ${color} flex items-center justify-center text-white`}>
                      <Icon className="size-4" />
                    </div>
                    <h2 className="font-semibold text-[#0b3c5d]">{label}</h2>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{count}</span>
                  </div>
                  <Link href={link} className="text-sm text-[#0b3c5d] hover:underline flex items-center gap-1">
                    View All <ArrowRight className="size-3" />
                  </Link>
                </div>
                <div className="divide-y divide-gray-50">
                  {items.map((item: any, i: number) => {
                    const rendered = renderItem(item)
                    return (
                      <div key={item.id || i} className="px-5 py-3 flex items-center gap-3">
                        <div className={`size-10 rounded-lg ${color}/10 flex items-center justify-center ${color.replace('bg-', 'text-')} shrink-0`}>
                          <Icon className="size-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium text-gray-900 truncate">{rendered.title}</div>
                          <div className="text-xs text-gray-500">{rendered.sub}</div>
                        </div>
                      </div>
                    )
                  })}
                  {items.length === 0 && (
                    <div className="px-5 py-6 text-center text-gray-400 text-sm">No items yet</div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* User Management Preview */}
          {users.data && users.data.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="size-8 rounded-lg bg-red-500 flex items-center justify-center text-white">
                    <Shield className="size-4" />
                  </div>
                  <h2 className="font-semibold text-[#0b3c5d]">User Management</h2>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{users.data.length}</span>
                </div>
                <Link href="/users" className="text-sm text-[#0b3c5d] hover:underline flex items-center gap-1">
                  Manage Users <ArrowRight className="size-3" />
                </Link>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Name</th>
                      <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Email</th>
                      <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Role</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {users.data.slice(0, 5).map((u: any) => (
                      <tr key={u.id} className="hover:bg-gray-50">
                        <td className="px-5 py-3 text-sm font-medium text-gray-900">{u.name}</td>
                        <td className="px-5 py-3 text-sm text-gray-500">{u.email}</td>
                        <td className="px-5 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            u.role === 'admin' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
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
        </>
      )}
    </div>
  )
}
