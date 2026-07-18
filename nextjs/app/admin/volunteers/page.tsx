'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/admin/api'
import { Plus, Pencil, Trash2, Users, Calendar, Clock, MapPin, UserPlus, ChevronLeft, ChevronRight, ToggleLeft, ToggleRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'

const statusColors: Record<string, string> = {
  assigned: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-green-100 text-green-800',
  completed: 'bg-blue-100 text-blue-800',
}

const defaultColors = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444', '#EC4899', '#06B6D4', '#84CC16']

export default function VolunteersPage() {
  const qc = useQueryClient()

  // Tab state
  const [tab, setTab] = useState<'calendar' | 'teams'>('calendar')
  const [weekOffset, setWeekOffset] = useState(0)

  // Team form state
  const [showTeamForm, setShowTeamForm] = useState(false)
  const [editingTeam, setEditingTeam] = useState<any>(null)
  const [teamForm, setTeamForm] = useState<Record<string, any>>({})

  // Shift form state
  const [showShiftForm, setShowShiftForm] = useState(false)
  const [editingShift, setEditingShift] = useState<any>(null)
  const [shiftForm, setShiftForm] = useState<Record<string, any>>({})
  const [selectedShiftDetail, setSelectedShiftDetail] = useState<any>(null)

  // Assignment form state
  const [showAssignmentForm, setShowAssignmentForm] = useState(false)
  const [assignmentForm, setAssignmentForm] = useState<Record<string, any>>({})

  const [confirmDelete, setConfirmDelete] = useState<{ type: string; id: string } | null>(null)

  // Compute week range
  const today = new Date()
  const startOfWeek = new Date(today)
  startOfWeek.setDate(today.getDate() - today.getDay() + 1 + weekOffset * 7) // Monday
  const endOfWeek = new Date(startOfWeek)
  endOfWeek.setDate(startOfWeek.getDate() + 6) // Sunday

  const fromStr = startOfWeek.toISOString().split('T')[0]
  const toStr = endOfWeek.toISOString().split('T')[0]

  // Queries
  const { data: teams = [] } = useQuery({
    queryKey: ['volunteer-teams'],
    queryFn: () => api.get('/volunteer-teams').then(r => r.data),
  })

  const { data: shifts = [], isLoading: shiftsLoading } = useQuery({
    queryKey: ['volunteer-shifts', fromStr, toStr],
    queryFn: () => api.get(`/volunteer-shifts?from_date=${fromStr}&to_date=${toStr}`).then(r => r.data),
  })

  // Mutations
  const createTeamMut = useMutation({
    mutationFn: (data: any) => api.post('/volunteer-teams', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['volunteer-teams'] }); setShowTeamForm(false); setTeamForm({}); toast.success('Team created') },
    onError: () => toast.error('Failed to create team'),
  })

  const updateTeamMut = useMutation({
    mutationFn: ({ id, data }: any) => api.put(`/volunteer-teams/${id}`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['volunteer-teams'] }); setShowTeamForm(false); setEditingTeam(null); setTeamForm({}); toast.success('Team updated') },
    onError: () => toast.error('Failed to update team'),
  })

  const toggleTeamMut = useMutation({
    mutationFn: (id: string) => api.put(`/volunteer-teams/${id}/toggle`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['volunteer-teams'] }); toast.success('Team toggled') },
  })

  const deleteTeamMut = useMutation({
    mutationFn: (id: string) => api.delete(`/volunteer-teams/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['volunteer-teams'] }); qc.invalidateQueries({ queryKey: ['volunteer-shifts'] }); setConfirmDelete(null); toast.success('Team deleted') },
  })

  const createShiftMut = useMutation({
    mutationFn: (data: any) => api.post('/volunteer-shifts', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['volunteer-shifts'] }); setShowShiftForm(false); setShiftForm({}); toast.success('Shift created') },
    onError: () => toast.error('Failed to create shift'),
  })

  const updateShiftMut = useMutation({
    mutationFn: ({ id, data }: any) => api.put(`/volunteer-shifts/${id}`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['volunteer-shifts'] }); setShowShiftForm(false); setEditingShift(null); setShiftForm({}); toast.success('Shift updated') },
    onError: () => toast.error('Failed to update shift'),
  })

  const deleteShiftMut = useMutation({
    mutationFn: (id: string) => api.delete(`/volunteer-shifts/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['volunteer-shifts'] }); setConfirmDelete(null); setSelectedShiftDetail(null); toast.success('Shift deleted') },
  })

  const createAssignmentMut = useMutation({
    mutationFn: (data: any) => api.post('/volunteer-assignments', data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['volunteer-shifts'] });
      if (selectedShiftDetail) {
        api.get(`/volunteer-shifts/${selectedShiftDetail.shift.id}`).then(r => setSelectedShiftDetail(r.data));
      }
      setShowAssignmentForm(false); setAssignmentForm({}); toast.success('Volunteer assigned')
    },
    onError: () => toast.error('Failed to assign volunteer'),
  })

  const updateAssignmentMut = useMutation({
    mutationFn: ({ id, data }: any) => api.put(`/volunteer-assignments/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['volunteer-shifts'] });
      if (selectedShiftDetail) {
        api.get(`/volunteer-shifts/${selectedShiftDetail.shift.id}`).then(r => setSelectedShiftDetail(r.data));
      }
      toast.success('Assignment updated')
    },
  })

  const deleteAssignmentMut = useMutation({
    mutationFn: (id: string) => api.delete(`/volunteer-assignments/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['volunteer-shifts'] });
      if (selectedShiftDetail) {
        api.get(`/volunteer-shifts/${selectedShiftDetail.shift.id}`).then(r => setSelectedShiftDetail(r.data));
      }
      toast.success('Assignment removed')
    },
  })

  // Helpers
  const weekLabel = `${startOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${endOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`

  const daysOfWeek = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startOfWeek)
    d.setDate(startOfWeek.getDate() + i)
    return d.toISOString().split('T')[0]
  })

  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  const shiftsByDay = daysOfWeek.reduce((acc, date) => {
    acc[date] = shifts.filter((s: any) => s.shiftDate === date)
    return acc
  }, {} as Record<string, any[]>)

  const totalSlots = shifts.reduce((sum: number, s: any) => sum + (s.shift?.slots ?? s.slots ?? 1), 0)
  const totalFilled = shifts.reduce((sum: number, s: any) => sum + (s.assignments?.length ?? 0), 0)

  const openCreateTeam = () => { setEditingTeam(null); setTeamForm({ color: '#3B82F6' }); setShowTeamForm(true) }
  const openEditTeam = (team: any) => { setEditingTeam(team); setTeamForm({ ...team }); setShowTeamForm(true) }

  const openCreateShift = (date?: string) => {
    setEditingShift(null)
    setShiftForm({
      teamId: teams[0]?.id ?? '',
      shiftDate: date || new Date().toISOString().split('T')[0],
      startTime: '09:00',
      endTime: '12:00',
      slots: 1,
    })
    setShowShiftForm(true)
  }

  const openEditShift = (shift: any) => {
    setEditingShift(shift)
    setShiftForm({
      teamId: shift.teamId ?? shift.team_id,
      title: shift.title,
      shiftDate: shift.shiftDate ?? shift.shift_date,
      startTime: (shift.startTime ?? shift.start_time ?? '').slice(0, 5),
      endTime: (shift.endTime ?? shift.end_time ?? '').slice(0, 5),
      location: shift.location,
      slots: shift.slots,
      notes: shift.notes,
    })
    setShowShiftForm(true)
  }

  const openAssignment = (shift: any) => {
    setAssignmentForm({ shiftId: shift.shift?.id ?? shift.id, status: 'assigned' })
    setShowAssignmentForm(true)
  }

  const formatTime = (t: string) => {
    if (!t) return ''
    const parts = t.slice(0, 5).split(':')
    const h = parseInt(parts[0])
    const m = parts[1]
    const period = h >= 12 ? 'PM' : 'AM'
    const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h
    return `${h12}:${m} ${period}`
  }

  const handleTeamSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingTeam) updateTeamMut.mutate({ id: editingTeam.id, data: teamForm })
    else createTeamMut.mutate(teamForm)
  }

  const handleShiftSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingShift) updateShiftMut.mutate({ id: editingShift.shift?.id ?? editingShift.id, data: shiftForm })
    else createShiftMut.mutate(shiftForm)
  }

  const handleAssignmentSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createAssignmentMut.mutate(assignmentForm)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Volunteer Scheduling</h1>
        <div className="flex gap-2">
          <Button onClick={() => setTab('calendar')} variant={tab === 'calendar' ? 'default' : 'outline'} className={tab === 'calendar' ? 'bg-church-blue hover:bg-church-blue/90' : ''}>Calendar</Button>
          <Button onClick={() => setTab('teams')} variant={tab === 'teams' ? 'default' : 'outline'} className={tab === 'teams' ? 'bg-church-blue hover:bg-church-blue/90' : ''}>Teams</Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="size-9 rounded-lg bg-blue-100 flex items-center justify-center"><Users className="size-5 text-blue-600" /></div><div><div className="text-xl font-bold">{teams.length}</div><div className="text-xs text-muted-foreground">Teams</div></div></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="size-9 rounded-lg bg-green-100 flex items-center justify-center"><Calendar className="size-5 text-green-600" /></div><div><div className="text-xl font-bold">{shifts.length}</div><div className="text-xs text-muted-foreground">Shifts This Week</div></div></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="size-9 rounded-lg bg-purple-100 flex items-center justify-center"><UserPlus className="size-5 text-purple-600" /></div><div><div className="text-xl font-bold">{totalFilled}</div><div className="text-xs text-muted-foreground">Volunteers Assigned</div></div></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="size-9 rounded-lg bg-orange-100 flex items-center justify-center"><Clock className="size-5 text-orange-600" /></div><div><div className="text-xl font-bold">{totalSlots - totalFilled}</div><div className="text-xs text-muted-foreground">Open Slots</div></div></div></CardContent></Card>
      </div>

      {/* Calendar View */}
      {tab === 'calendar' && (
        <>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => setWeekOffset(weekOffset - 1)} className="p-2 hover:bg-muted rounded-lg"><ChevronLeft className="size-4" /></button>
              <span className="font-medium text-sm">{weekLabel}</span>
              <button onClick={() => setWeekOffset(weekOffset + 1)} className="p-2 hover:bg-muted rounded-lg"><ChevronRight className="size-4" /></button>
              {weekOffset !== 0 && <Button variant="outline" size="sm" onClick={() => setWeekOffset(0)}>Today</Button>}
            </div>
            <Button onClick={() => openCreateShift()} className="bg-church-blue hover:bg-church-blue/90"><Plus className="size-4 mr-1" /> Add Shift</Button>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {daysOfWeek.map((date, i) => {
              const d = new Date(date + 'T00:00:00')
              const isToday = date === new Date().toISOString().split('T')[0]
              return (
                <div key={date} className="min-h-[200px]">
                  <div className={`text-center p-2 rounded-t-lg text-sm font-medium ${isToday ? 'bg-church-blue text-white' : 'bg-muted'}`}>
                    <div>{dayNames[i]}</div>
                    <div className="text-xs">{d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                  </div>
                  <div className="space-y-1 p-1 border border-t-0 rounded-b-lg min-h-[140px]">
                    {(shiftsByDay[date] || []).map((s: any) => {
                      const shift = s.shift ?? s
                      const filled = s.assignments?.length ?? 0
                      const slots = shift.slots ?? 1
                      return (
                        <button
                          key={shift.id}
                          onClick={() => setSelectedShiftDetail(s)}
                          className="w-full text-left p-1.5 rounded text-xs border-l-3 hover:bg-muted/50 transition-colors"
                          style={{ borderLeftColor: s.teamColor ?? s.team_color ?? '#3B82F6' }}
                        >
                          <div className="font-medium truncate">{shift.title}</div>
                          <div className="text-muted-foreground">{formatTime(shift.startTime ?? shift.start_time)}</div>
                          <div className="text-muted-foreground">{filled}/{slots} volunteers</div>
                        </button>
                      )
                    })}
                    <button onClick={() => openCreateShift(date)} className="w-full text-center py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-muted rounded">+ Add</button>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* Teams View */}
      {tab === 'teams' && (
        <>
          <div className="flex justify-end">
            <Button onClick={openCreateTeam} className="bg-church-blue hover:bg-church-blue/90"><Plus className="size-4 mr-1" /> Add Team</Button>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {teams.map((team: any) => (
              <Card key={team.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="size-4 rounded-full" style={{ backgroundColor: team.color }} />
                      <div>
                        <div className="font-semibold">{team.name}</div>
                        {team.description && <div className="text-xs text-muted-foreground mt-1">{team.description}</div>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => toggleTeamMut.mutate(team.id)} className="p-1 hover:bg-muted rounded">
                        {team.enabled ? <ToggleRight className="size-5 text-green-600" /> : <ToggleLeft className="size-5 text-muted-foreground" />}
                      </button>
                      <button onClick={() => openEditTeam(team)} className="p-1 hover:bg-muted rounded"><Pencil className="size-3.5" /></button>
                      <button onClick={() => setConfirmDelete({ type: 'team', id: team.id })} className="p-1 hover:bg-destructive/10 text-destructive rounded"><Trash2 className="size-3.5" /></button>
                    </div>
                  </div>
                  <div className="mt-3 text-xs text-muted-foreground">
                    {team.enabled ? 'Active' : 'Disabled'} · Order: {team.sortOrder ?? team.sort_order}
                  </div>
                </CardContent>
              </Card>
            ))}
            {teams.length === 0 && <Card><CardContent className="p-8 text-center text-muted-foreground">No teams yet. Create one to get started.</CardContent></Card>}
          </div>
        </>
      )}

      {/* Shift Detail Slide-over */}
      {selectedShiftDetail && (
        <Dialog open={true} onOpenChange={(open) => { if (!open) setSelectedShiftDetail(null) }}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center gap-2">
                <div className="size-3 rounded-full" style={{ backgroundColor: selectedShiftDetail.teamColor ?? selectedShiftDetail.team_color }} />
                <DialogTitle>{selectedShiftDetail.shift?.title ?? selectedShiftDetail.title}</DialogTitle>
              </div>
              <DialogDescription>{selectedShiftDetail.teamName ?? selectedShiftDetail.team_name}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-muted-foreground">Date:</span> <span className="font-medium">{selectedShiftDetail.shift?.shiftDate ?? selectedShiftDetail.shift_date}</span></div>
                <div><span className="text-muted-foreground">Time:</span> <span className="font-medium">{formatTime(selectedShiftDetail.shift?.startTime ?? selectedShiftDetail.start_time)} – {formatTime(selectedShiftDetail.shift?.endTime ?? selectedShiftDetail.end_time)}</span></div>
                <div><span className="text-muted-foreground">Location:</span> <span className="font-medium">{selectedShiftDetail.shift?.location || selectedShiftDetail.location || 'Not set'}</span></div>
                <div><span className="text-muted-foreground">Slots:</span> <span className="font-medium">{selectedShiftDetail.assignments?.length ?? 0} / {selectedShiftDetail.shift?.slots ?? selectedShiftDetail.slots}</span></div>
              </div>
              {(selectedShiftDetail.shift?.notes || selectedShiftDetail.notes) && (
                <div className="text-sm"><span className="text-muted-foreground">Notes:</span> {selectedShiftDetail.shift?.notes ?? selectedShiftDetail.notes}</div>
              )}

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-sm">Volunteers</h4>
                  <Button size="sm" variant="outline" onClick={() => openAssignment(selectedShiftDetail)}><Plus className="size-3 mr-1" /> Assign</Button>
                </div>
                {selectedShiftDetail.assignments?.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No volunteers assigned yet.</p>
                ) : (
                  <div className="space-y-2">
                    {selectedShiftDetail.assignments?.map((a: any) => (
                      <div key={a.id} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                        <div>
                          <span className="font-medium text-sm">{a.name || 'Unnamed'}</span>
                          <Badge variant="secondary" className={`ml-2 text-xs ${statusColors[a.status] || ''}`}>{a.status}</Badge>
                        </div>
                        <div className="flex gap-1">
                          {a.status !== 'confirmed' && <Button size="sm" variant="ghost" onClick={() => updateAssignmentMut.mutate({ id: a.id, data: { status: 'confirmed' } })}>Confirm</Button>}
                          {a.status !== 'completed' && <Button size="sm" variant="ghost" onClick={() => updateAssignmentMut.mutate({ id: a.id, data: { status: 'completed' } })}>Complete</Button>}
                          <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteAssignmentMut.mutate(a.id)}>Remove</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-between pt-2">
                <Button variant="outline" onClick={() => { openEditShift(selectedShiftDetail); setSelectedShiftDetail(null) }}><Pencil className="size-3 mr-1" /> Edit Shift</Button>
                <Button variant="destructive" onClick={() => setConfirmDelete({ type: 'shift', id: selectedShiftDetail.shift?.id ?? selectedShiftDetail.id })}><Trash2 className="size-3 mr-1" /> Delete</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Team Form Dialog */}
      <Dialog open={showTeamForm} onOpenChange={setShowTeamForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingTeam ? 'Edit' : 'Create'} Team</DialogTitle>
            <DialogDescription>{editingTeam ? 'Update the volunteer team.' : 'Add a new volunteer team.'}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleTeamSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Team Name *</Label>
              <Input value={teamForm.name ?? ''} onChange={e => setTeamForm({ ...teamForm, name: e.target.value })} placeholder="e.g. Worship Team" required />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={teamForm.description ?? ''} onChange={e => setTeamForm({ ...teamForm, description: e.target.value })} placeholder="What does this team do?" />
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex gap-2 flex-wrap">
                {defaultColors.map(c => (
                  <button key={c} type="button" onClick={() => setTeamForm({ ...teamForm, color: c })} className={`size-8 rounded-full border-2 ${teamForm.color === c ? 'border-foreground scale-110' : 'border-transparent'}`} style={{ backgroundColor: c }} />
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Sort Order</Label>
                <Input type="number" value={teamForm.sort_order ?? 0} onChange={e => setTeamForm({ ...teamForm, sort_order: Number(e.target.value) })} />
              </div>
              <div className="space-y-2">
                <Label>Enabled</Label>
                <Select value={teamForm.enabled !== false ? 'true' : 'false'} onValueChange={val => setTeamForm({ ...teamForm, enabled: val === 'true' })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Yes</SelectItem>
                    <SelectItem value="false">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowTeamForm(false)}>Cancel</Button>
              <Button type="submit" disabled={createTeamMut.isPending || updateTeamMut.isPending} className="bg-church-blue hover:bg-church-blue/90">
                {createTeamMut.isPending || updateTeamMut.isPending ? 'Saving...' : 'Save'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Shift Form Dialog */}
      <Dialog open={showShiftForm} onOpenChange={setShowShiftForm}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingShift ? 'Edit' : 'Create'} Shift</DialogTitle>
            <DialogDescription>{editingShift ? 'Update this volunteer shift.' : 'Add a new volunteer shift.'}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleShiftSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Team *</Label>
              <Select value={shiftForm.teamId ?? ''} onValueChange={val => setShiftForm({ ...shiftForm, teamId: val })}>
                <SelectTrigger><SelectValue placeholder="Select team" /></SelectTrigger>
                <SelectContent>
                  {teams.map((t: any) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input value={shiftForm.title ?? ''} onChange={e => setShiftForm({ ...shiftForm, title: e.target.value })} placeholder="e.g. Sunday Morning Worship" required />
            </div>
            <div className="space-y-2">
              <Label>Date *</Label>
              <Input type="date" value={shiftForm.shiftDate ?? ''} onChange={e => setShiftForm({ ...shiftForm, shiftDate: e.target.value })} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Time *</Label>
                <Input type="time" value={shiftForm.startTime ?? ''} onChange={e => setShiftForm({ ...shiftForm, startTime: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>End Time *</Label>
                <Input type="time" value={shiftForm.endTime ?? ''} onChange={e => setShiftForm({ ...shiftForm, endTime: e.target.value })} required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Location</Label>
                <Input value={shiftForm.location ?? ''} onChange={e => setShiftForm({ ...shiftForm, location: e.target.value })} placeholder="e.g. Main Hall" />
              </div>
              <div className="space-y-2">
                <Label>Slots</Label>
                <Input type="number" min="1" value={shiftForm.slots ?? 1} onChange={e => setShiftForm({ ...shiftForm, slots: Number(e.target.value) })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea value={shiftForm.notes ?? ''} onChange={e => setShiftForm({ ...shiftForm, notes: e.target.value })} placeholder="Any additional notes" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowShiftForm(false)}>Cancel</Button>
              <Button type="submit" disabled={createShiftMut.isPending || updateShiftMut.isPending} className="bg-church-blue hover:bg-church-blue/90">
                {createShiftMut.isPending || updateShiftMut.isPending ? 'Saving...' : 'Save'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Assignment Form Dialog */}
      <Dialog open={showAssignmentForm} onOpenChange={setShowAssignmentForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Volunteer</DialogTitle>
            <DialogDescription>Add a volunteer to this shift.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAssignmentSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input value={assignmentForm.name ?? ''} onChange={e => setAssignmentForm({ ...assignmentForm, name: e.target.value })} placeholder="Volunteer name" required />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={assignmentForm.status ?? 'assigned'} onValueChange={val => setAssignmentForm({ ...assignmentForm, status: val })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="assigned">Assigned</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Input value={assignmentForm.notes ?? ''} onChange={e => setAssignmentForm({ ...assignmentForm, notes: e.target.value })} placeholder="Optional notes" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowAssignmentForm(false)}>Cancel</Button>
              <Button type="submit" disabled={createAssignmentMut.isPending} className="bg-church-blue hover:bg-church-blue/90">
                {createAssignmentMut.isPending ? 'Assigning...' : 'Assign'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!confirmDelete} onOpenChange={(open) => { if (!open) setConfirmDelete(null) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete {confirmDelete?.type}?</DialogTitle>
            <DialogDescription>This will permanently remove this {confirmDelete?.type}. {confirmDelete?.type === 'shift' ? 'All assignments will also be removed.' : ''}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => {
              if (confirmDelete?.type === 'team') deleteTeamMut.mutate(confirmDelete.id)
              else if (confirmDelete?.type === 'shift') deleteShiftMut.mutate(confirmDelete.id)
            }} disabled={deleteTeamMut.isPending || deleteShiftMut.isPending}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
