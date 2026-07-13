import { useQuery } from '@tanstack/react-query'
import api from '../lib/api'
import { BookOpen, Calendar, Users, Bell, Image, Quote, UserCheck, Clock, Bible, DollarSign, Settings } from 'lucide-react'

export function Dashboard() {
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

  const allLoading = [sermons, events, ministries, notices, leaders, gallery, testimonies, members, serviceTimes, verses, campaigns, settings].some(q => q.isLoading)

  const stats = [
    { label: 'Sermons', value: sermons.data?.length ?? 0, icon: BookOpen, color: 'bg-blue-500' },
    { label: 'Events', value: events.data?.length ?? 0, icon: Calendar, color: 'bg-green-500' },
    { label: 'Ministries', value: ministries.data?.length ?? 0, icon: Users, color: 'bg-purple-500' },
    { label: 'Notices', value: notices.data?.length ?? 0, icon: Bell, color: 'bg-orange-500' },
    { label: 'Leaders', value: leaders.data?.length ?? 0, icon: UserCheck, color: 'bg-teal-500' },
    { label: 'Gallery', value: gallery.data?.length ?? 0, icon: Image, color: 'bg-pink-500' },
    { label: 'Testimonies', value: testimonies.data?.length ?? 0, icon: Quote, color: 'bg-amber-500' },
    { label: 'Members', value: members.data?.length ?? 0, icon: Users, color: 'bg-indigo-500' },
    { label: 'Service Times', value: serviceTimes.data?.length ?? 0, icon: Clock, color: 'bg-cyan-500' },
    { label: 'Verses', value: verses.data?.length ?? 0, icon: Bible, color: 'bg-rose-500' },
    { label: 'Campaigns', value: campaigns.data?.length ?? 0, icon: DollarSign, color: 'bg-emerald-500' },
    { label: 'Settings', value: settings.data?.length ?? 0, icon: Settings, color: 'bg-gray-500' },
  ]

  const recentSermons = sermons.data?.slice(0, 3) ?? []
  const upcomingEvents = events.data?.slice(0, 3) ?? []

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#0b3c5d] mb-6">Dashboard</h1>

      {allLoading ? (
        <div className="text-center py-12 text-gray-500">Loading dashboard...</div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 mb-8">
            {stats.map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <div className="flex items-center gap-3">
                  <div className={`size-10 rounded-lg ${color} flex items-center justify-center text-white shrink-0`}>
                    <Icon className="size-5" />
                  </div>
                  <div>
                    <div className="text-xl font-bold text-gray-900">{value}</div>
                    <div className="text-xs text-gray-500">{label}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Recent Content */}
          <div className="grid lg:grid-cols-2 gap-6 mt-8">
            {/* Recent Sermons */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="font-semibold text-[#0b3c5d]">Recent Sermons</h2>
              </div>
              <div className="divide-y divide-gray-50">
                {recentSermons.map((s: any) => (
                  <div key={s.id} className="px-5 py-3 flex items-center gap-3">
                    <div className="size-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                      <BookOpen className="size-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">{s.title}</div>
                      <div className="text-xs text-gray-500">{s.speaker} · {s.date}</div>
                    </div>
                  </div>
                ))}
                {recentSermons.length === 0 && (
                  <div className="px-5 py-6 text-center text-gray-400 text-sm">No sermons yet</div>
                )}
              </div>
            </div>

            {/* Upcoming Events */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="font-semibold text-[#0b3c5d]">Upcoming Events</h2>
              </div>
              <div className="divide-y divide-gray-50">
                {upcomingEvents.map((e: any) => (
                  <div key={e.id} className="px-5 py-3 flex items-center gap-3">
                    <div className="size-10 rounded-lg bg-green-100 flex items-center justify-center text-green-600 shrink-0">
                      <Calendar className="size-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">{e.title}</div>
                      <div className="text-xs text-gray-500">{e.displayDate} · {e.location}</div>
                    </div>
                  </div>
                ))}
                {upcomingEvents.length === 0 && (
                  <div className="px-5 py-6 text-center text-gray-400 text-sm">No upcoming events</div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
