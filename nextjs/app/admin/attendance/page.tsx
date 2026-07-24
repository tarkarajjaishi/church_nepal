'use client'

import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/admin/api'
import {
  Users,
  UserPlus,
  Search as SearchIcon,
  CheckCircle2,
  Calendar,
  TrendingUp,
  ClipboardCheck,
  BarChart3,
  X,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Loading, EmptyState } from '@/components/LoadingStates'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

type Tab = 'checkin' | 'kiosk' | 'reports'

const TABS: { key: Tab; label: string }[] = [
  { key: 'checkin', label: 'Check-In' },
  { key: 'kiosk', label: 'Kiosk' },
  { key: 'reports', label: 'Reports' },
]

function unwrapPaginated(res: unknown): any[] {
  if (Array.isArray(res)) return res
  if (res && typeof res === 'object' && Array.isArray((res as any).data)) return (res as any).data
  return []
}

const SAMPLE_SERVICES = [{ name: 'Sunday Service' }, { name: 'Midweek Service' }]

export default function AttendancePage() {
  const qc = useQueryClient()
  const [tab, setTab] = useState<Tab>('checkin')

  const [memberName, setMemberName] = useState('')
  const [memberPersonId, setMemberPersonId] = useState('')
  const [eventId, setEventId] = useState('')
  const [serviceName, setServiceName] = useState('Sunday Service')
  const [serviceDate, setServiceDate] = useState(() => new Date().toISOString().split('T')[0])
  const [showForm, setShowForm] = useState(false)
  const [memberSearch, setMemberSearch] = useState('')

  const today = new Date().toISOString().split('T')[0]

  const { data: eventsRaw } = useQuery({
    queryKey: ['events'],
    queryFn: () => api.get('/events').then(r => r.data),
  })
  const events = useMemo(() => unwrapPaginated(eventsRaw), [eventsRaw])

  const { data: serviceTimesRaw } = useQuery({
    queryKey: ['service-times'],
    queryFn: () => api.get('/service-times').then(r => r.data),
  })
  const serviceList = useMemo(() => {
    const raw = unwrapPaginated(serviceTimesRaw).map((s: any) => ({ name: s.name }))
    return raw.length > 0 ? raw : SAMPLE_SERVICES
  }, [serviceTimesRaw])

  const { data: todayAttendance = [], isLoading: listLoading, refetch: refetchList } = useQuery({
    queryKey: ['attendance', 'today', today],
    queryFn: () => api.get(`/attendance?date=${today}`).then(r => r.data),
  })

  const { data: stats = {} } = useQuery({
    queryKey: ['attendance', 'stats'],
    queryFn: () => api.get('/attendance/stats').then(r => r.data),
  })

  const { data: currentByService = [] } = useQuery({
    queryKey: ['attendance', 'by-service', today],
    queryFn: () => api.get(`/attendance/by-service?date=${today}`).then(r => r.data),
  })

  const checkinMut = useMutation({
    mutationFn: (data: any) => api.post('/attendance', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['attendance'] })
      setMemberName('')
      setMemberPersonId('')
      setEventId('')
      setShowForm(false)
      toast.success('Check-in recorded!')
    },
    onError: () => toast.error('Failed to record check-in'),
  })

  const kioskMut = useMutation({
    mutationFn: (data: any) => api.post('/attendance', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['attendance'] })
      setMemberSearch('')
      toast.success('Checked in!')
    },
    onError: () => toast.error('Failed to check in'),
  })

  const { data: membersRaw, isLoading: membersLoading } = useQuery({
    queryKey: ['members', 'search', memberSearch],
    queryFn: () => api.get(`/members?search=${encodeURIComponent(memberSearch)}`).then(r => r.data),
    enabled: tab === 'kiosk' && memberSearch.trim().length >= 2,
  })
  const members = useMemo(() => {
    const all = unwrapPaginated(membersRaw)
    const term = memberSearch.toLowerCase()
    return term ? all.filter((m: any) => (m.name || '').toLowerCase().includes(term)) : all
  }, [membersRaw, memberSearch])

  const isKioskChecked = (m: any) => {
    if (!m) return false
    return todayAttendance.some((a: any) => a.personId === m.id || a.name === m.name)
  }

  const handleKioskTap = (m: any) => {
    if (isKioskChecked(m) || kioskMut.isPending) return
    kioskMut.mutate({
      name: m.name,
      personId: m.id,
      serviceDate: today,
      serviceName,
    })
  }

  const handleCheckinSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!memberName.trim()) return
    checkinMut.mutate({
      name: memberName,
      personId: memberPersonId || undefined,
      eventId: eventId || undefined,
      serviceDate,
      serviceName: serviceName || 'Sunday Service',
    })
  }

  // Reports
  const [trendRange, setTrendRange] = useState('30d')
  const { data: trendsRaw, isLoading: trendsLoading } = useQuery({
    queryKey: ['attendance', 'trends', trendRange],
    queryFn: () => {
      const params = new URLSearchParams({ range: trendRange })
      return api.get(`/attendance/trends?${params}`).then(r => r.data)
    },
    enabled: tab === 'reports',
  })
  const trends = useMemo(() => (Array.isArray(trendsRaw) ? trendsRaw : []), [trendsRaw])

  const [reportDate, setReportDate] = useState(today)
  const { data: byServiceReportRaw, isLoading: byServiceLoading } = useQuery({
    queryKey: ['attendance', 'by-service', reportDate],
    queryFn: () => api.get(`/attendance/by-service?date=${reportDate}`).then(r => r.data),
    enabled: tab === 'reports',
  })
  const byServiceReport = useMemo(() => (Array.isArray(byServiceReportRaw) ? byServiceReportRaw as any[] : []), [byServiceReportRaw])
  const maxByService = useMemo(() => Math.max(1, ...byServiceReport.map((r: any) => r.count)), [byServiceReport])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#0b3c5d]">Attendance</h1>
        {tab !== 'kiosk' && (
          <Button onClick={() => setShowForm(true)} className="bg-church-blue hover:bg-church-blue/90">
            <UserPlus className="size-4 mr-1" /> Record
          </Button>
        )}
      </div>

      <div className="flex gap-1 border-b">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              tab === t.key ? 'border-b-2 border-church-blue text-church-blue' : 'text-muted-foreground hover:text-foreground'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'checkin' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Today', value: (stats as any).today ?? todayAttendance.length, icon: Calendar, color: 'bg-blue-500' },
              { label: 'This Week', value: (stats as any).thisWeek ?? 0, icon: TrendingUp, color: 'bg-green-500' },
              { label: 'Total', value: (stats as any).total ?? 0, icon: Users, color: 'bg-purple-500' },
              { label: 'Services Today', value: currentByService.length, icon: ClipboardCheck, color: 'bg-orange-500' },
            ].map(({ label, value, icon: Icon, color }) => (
              <Card key={label}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`size-9 rounded-lg ${color} flex items-center justify-center text-white`}>
                      <Icon className="size-5" />
                    </div>
                    <div>
                      <div className="text-xl font-bold">{value}</div>
                      <div className="text-xs text-muted-foreground">{label}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {currentByService.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Today — Per Service</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  {currentByService.map((row: any, i: number) => (
                    <div key={i} className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg">
                      <span className="text-sm font-medium">{row.serviceName}</span>
                      <Badge variant="secondary">{row.count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Today&apos;s Check-ins</CardTitle>
            </CardHeader>
            <CardContent>
              {listLoading ? (
                <Loading />
              ) : todayAttendance.length === 0 ? (
                <EmptyState icon={<Users className="size-10" />} title="No check-ins today yet" description="Check-ins will appear here as people arrive." />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-muted-foreground">
                        <th className="p-2">Name</th>
                        <th className="p-2">Service</th>
                        <th className="p-2">Time</th>
                        <th className="p-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {todayAttendance.map((a: any) => (
                        <tr key={a.id} className="border-b last:border-0 hover:bg-muted/50">
                          <td className="p-2 font-medium">{a.name}</td>
                          <td className="p-2 text-muted-foreground">{a.serviceName}</td>
                          <td className="p-2 text-muted-foreground">
                            {a.checkedInAt ? new Date(a.checkedInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                          </td>
                          <td className="p-2">
                            <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                              <CheckCircle2 className="size-3 mr-1" /> Present
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {tab === 'kiosk' && (
        <Card>
          <CardHeader>
            <CardTitle>Member Check-In (Kiosk)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Active Service</Label>
              <div className="flex flex-wrap gap-2">
                {serviceList.map((st: any) => (
                  <Button key={st.name} type="button" variant={serviceName === st.name ? 'default' : 'outline'} onClick={() => setServiceName(st.name)} className={serviceName === st.name ? 'bg-church-blue hover:bg-church-blue/90' : ''}>
                    {st.name}
                  </Button>
                ))}
              </div>
            </div>

            <div className="relative">
              <SearchIcon className="size-5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input autoFocus value={memberSearch} onChange={e => setMemberSearch(e.target.value)} placeholder="Search members by name..." className="pl-10 text-lg py-6" />
              {memberSearch && (
                <Button variant="ghost" size="sm" className="absolute right-2 top-1/2 -translate-y-1/2" onClick={() => setMemberSearch('')}>
                  <X className="size-4" />
                </Button>
              )}
            </div>

            {memberSearch.trim().length < 2 ? (
              <EmptyState icon={<SearchIcon className="size-10" />} title="Start typing to search" description="Type at least 2 characters to find a member." />
            ) : membersLoading || kioskMut.isPending ? (
              <Loading message="Searching..." />
            ) : members.length === 0 ? (
              <EmptyState icon={<Users className="size-10" />} title="No members found" description="Try a different name." />
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {members.map((m: any) => {
                  const checked = isKioskChecked(m)
                  return (
                    <button key={m.id} type="button" onClick={() => handleKioskTap(m)} disabled={checked || kioskMut.isPending}
                      className={`flex flex-col items-center justify-center p-6 rounded-xl border-2 transition ${
                        checked ? 'bg-green-50 border-green-300 text-green-700 cursor-not-allowed' : 'bg-white border-border hover:border-church-blue hover:bg-[#f7f9fc] cursor-pointer'
                      }`}>
                      <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mb-2 ${
                        checked ? 'bg-green-100 text-green-700' : 'bg-[#eaf2f6] text-church-blue'
                      }`}>
                        {checked ? <CheckCircle2 className="size-8" /> : (m.name?.[0]?.toUpperCase() ?? '?')}
                      </div>
                      <span className="font-medium text-sm text-center line-clamp-2">{m.name}</span>
                      <span className="text-xs text-muted-foreground mt-1">{m.role || ''}</span>
                      {checked && <span className="text-xs font-semibold mt-2">Checked In</span>}
                    </button>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {tab === 'reports' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Today', value: (stats as any).today ?? 0, icon: Calendar, color: 'bg-blue-500' },
              { label: 'This Week', value: (stats as any).thisWeek ?? 0, icon: TrendingUp, color: 'bg-green-500' },
              { label: 'Total', value: (stats as any).total ?? 0, icon: Users, color: 'bg-purple-500' },
              { label: 'Avg / Service', value: (() => {
                const unique = new Set(todayAttendance.map((a: any) => a.serviceName)).size
                const total = todayAttendance.length
                return unique ? Math.round(total / unique) : 0
              })(), icon: ClipboardCheck, color: 'bg-orange-500' },
            ].map(({ label, value, icon: Icon, color }) => (
              <Card key={label}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`size-9 rounded-lg ${color} flex items-center justify-center text-white`}>
                      <Icon className="size-5" />
                    </div>
                    <div>
                      <div className="text-xl font-bold">{value}</div>
                      <div className="text-xs text-muted-foreground">{label}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">Daily Attendance Trend</CardTitle>
              <div className="flex gap-2">
                {[
                  { key: '7d', label: '7 Days' },
                  { key: '30d', label: '30 Days' },
                  { key: '3m', label: '3 Months' },
                ].map(r => (
                  <button key={r.key} onClick={() => setTrendRange(r.key)}
                    className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${trendRange === r.key ? 'bg-church-blue text-white' : 'bg-muted hover:bg-muted/80 text-foreground'}`}>
                    {r.label}
                  </button>
                ))}
              </div>
            </CardHeader>
            <CardContent>
              {trendsLoading ? (
                <Loading message="Loading trends..." />
              ) : trends.length === 0 ? (
                <EmptyState icon={<BarChart3 className="size-8" />} title="No attendance data yet" description="Trends appear here once check-ins are recorded over time." />
              ) : (
                <ResponsiveContainer width="100%" height={320}>
                  <LineChart data={trends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="serviceDate" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                    <Tooltip labelFormatter={(v: any) => String(v)} formatter={(val: any) => [`${val} attendees`, '']} />
                    <Line type="monotone" dataKey="count" stroke="#0b3c5d" strokeWidth={2} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">Per-Service Breakdown</CardTitle>
              <div className="flex items-center gap-2">
                <Input type="date" value={reportDate} onChange={e => setReportDate(e.target.value)} className="w-auto text-sm" />
                <Button variant="outline" size="sm" onClick={() => setReportDate(today)}>Today</Button>
              </div>
            </CardHeader>
            <CardContent>
              {byServiceLoading ? (
                <Loading message="Loading by-service data..." />
              ) : byServiceReport.length === 0 ? (
                <EmptyState icon={<ClipboardCheck className="size-8" />} title="No data for this date" description="No attendance recorded for the selected date." />
              ) : (
                <div className="space-y-3">
                  {byServiceReport.map((row: any) => (
                    <div key={row.serviceName} className="flex items-center gap-4">
                      <span className="w-40 text-sm font-medium truncate">{row.serviceName}</span>
                      <div className="flex-1 h-6 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-church-blue rounded-full transition-all" style={{ width: `${Math.max(4, (row.count / maxByService) * 100)}%` }} />
                      </div>
                      <span className="text-sm font-semibold w-10 text-right">{row.count}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Record Attendance</DialogTitle>
            <DialogDescription>Check someone in for a service.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCheckinSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input value={memberName} onChange={e => setMemberName(e.target.value)} placeholder="Person's full name" required />
            </div>
            <div className="space-y-2">
              <Label>Service</Label>
              <div className="flex flex-wrap gap-2">
                {serviceList.map((st: any) => (
                  <Button key={st.name} type="button" variant={serviceName === st.name ? 'default' : 'outline'} onClick={() => setServiceName(st.name)} className={serviceName === st.name ? 'bg-church-blue hover:bg-church-blue/90' : ''}>
                    {st.name}
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Date</Label>
              <Input type="date" value={serviceDate} onChange={e => setServiceDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Event</Label>
              <Select value={eventId} onValueChange={setEventId}>
                <SelectTrigger><SelectValue placeholder="Select event (optional)" /></SelectTrigger>
                <SelectContent>
                  {events.map((ev: any) => (
                    <SelectItem key={ev.id} value={ev.id}>{ev.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button type="submit" disabled={checkinMut.isPending} className="bg-church-blue hover:bg-church-blue/90">
                {checkinMut.isPending ? 'Checking in...' : 'Check In'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
