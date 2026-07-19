'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/admin/api'
import { Users, UserPlus, Calendar, Search, CheckCircle2, Clock, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Loading, EmptyState } from '@/components/LoadingStates'

export default function AttendancePage() {
  const qc = useQueryClient()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [eventId, setEventId] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [showCheckinForm, setShowCheckinForm] = useState(false)

  const { data: events = [] } = useQuery({
    queryKey: ['events'],
    queryFn: () => api.get('/events').then(r => r.data),
  })

  const { data: todayAttendance = [], isLoading } = useQuery({
    queryKey: ['attendance', 'today'],
    queryFn: () => api.get('/attendance?date=today').then(r => r.data),
  })

  const { data: stats = {} } = useQuery({
    queryKey: ['attendance-stats'],
    queryFn: () => api.get('/attendance/stats').then(r => r.data),
  })

  const checkinMut = useMutation({
    mutationFn: (data: any) => api.post('/attendance', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['attendance'] })
      qc.invalidateQueries({ queryKey: ['attendance-stats'] })
      setName('')
      setEmail('')
      setEventId('')
      setShowCheckinForm(false)
      toast.success('Check-in recorded!')
    },
    onError: () => toast.error('Failed to record check-in'),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    checkinMut.mutate({ name, email, eventId: eventId || undefined, date: new Date().toISOString().split('T')[0] })
  }

  const filteredAttendance = todayAttendance.filter((a: any) =>
    !searchQuery || a.name?.toLowerCase().includes(searchQuery.toLowerCase()) || a.email?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#0b3c5d]">Attendance</h1>
        <Button onClick={() => setShowCheckinForm(true)} className="bg-church-blue hover:bg-church-blue/90">
          <UserPlus className="size-4 mr-1" /> Check In
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Today', value: stats.today ?? todayAttendance.length, icon: Users, color: 'bg-blue-500' },
          { label: 'This Week', value: stats.thisWeek ?? 0, icon: Calendar, color: 'bg-green-500' },
          { label: 'This Month', value: stats.thisMonth ?? 0, icon: TrendingUp, color: 'bg-purple-500' },
          { label: 'Avg per Service', value: stats.avgPerService ?? 0, icon: Clock, color: 'bg-orange-500' },
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

      {/* Today's Attendance */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>Today&apos;s Check-ins</CardTitle>
          <div className="relative">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search name or email..." className="pl-9 w-64" />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Loading />
          ) : filteredAttendance.length === 0 ? (
            <EmptyState
              icon={<Users className="size-10" />}
              title={todayAttendance.length === 0 ? 'No check-ins today yet' : 'No matching records found'}
              description={todayAttendance.length === 0 ? 'Check-ins will appear here as people arrive.' : 'Try adjusting your search.'}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="p-2">Name</th>
                    <th className="p-2">Email</th>
                    <th className="p-2">Event</th>
                    <th className="p-2">Time</th>
                    <th className="p-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAttendance.map((a: any) => (
                    <tr key={a.id} className="border-b last:border-0 hover:bg-muted/50">
                      <td className="p-2 font-medium">{a.name}</td>
                      <td className="p-2 text-muted-foreground">{a.email || '-'}</td>
                      <td className="p-2 text-muted-foreground">{a.eventName || a.eventName || '-'}</td>
                      <td className="p-2 text-muted-foreground">
                        {a.checkinTime ? new Date(a.checkinTime).toLocaleTimeString() : '-'}
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

      {/* Check-in Dialog */}
      <Dialog open={showCheckinForm} onOpenChange={setShowCheckinForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Record Attendance</DialogTitle>
            <DialogDescription>Check someone in for today&apos;s service.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="Person's name" required />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="person@email.com" />
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
              <Button type="button" variant="outline" onClick={() => setShowCheckinForm(false)}>Cancel</Button>
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
