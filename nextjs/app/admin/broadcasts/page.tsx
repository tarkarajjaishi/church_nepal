'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/admin/api'
import { Plus, Send, Radio, Mail, MessageSquare, Clock, CheckCircle2, AlertCircle, Edit3, Trash2, BarChart3, Users, Eye, CalendarClock } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Loading, EmptyState } from '@/components/LoadingStates'
import { RichTextEditor } from '@/components/admin/RichTextEditor'
import type { Broadcast, BroadcastRecipient, BroadcastStats } from '@/lib/types'

const statusConfig: Record<string, { color: string; icon: any }> = {
  draft: { color: 'bg-gray-100 text-gray-800', icon: Clock },
  sent: { color: 'bg-green-100 text-green-800', icon: CheckCircle2 },
  scheduled: { color: 'bg-blue-100 text-blue-800', icon: Schedule },
  sending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  failed: { color: 'bg-red-100 text-red-800', icon: AlertCircle },
}

const recipientGroups = [
  { value: 'all', label: 'All Subscribers & People' },
  { value: 'all_members', label: 'All Members' },
  { value: 'active_members', label: 'Active Members' },
  { value: 'visitors', label: 'Visitors' },
  { value: 'volunteers', label: 'Volunteers' },
  { value: 'small_groups', label: 'Small Groups' },
]

export default function BroadcastsPage() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editingBroadcast, setEditingBroadcast] = useState<Broadcast | null>(null)
  const [confirmSend, setConfirmSend] = useState<any>(null)
  const [confirmSchedule, setConfirmSchedule] = useState<any>(null)
  const [selectedBroadcast, setSelectedBroadcast] = useState<Broadcast | null>(null)
  const [showRecipients, setShowRecipients] = useState(false)
  const [showStats, setShowStats] = useState(false)
  const [form, setForm] = useState<Record<string, any>>({})
  const [scheduleDate, setScheduleDate] = useState('')

  const { data: broadcasts = [], isLoading } = useQuery({
    queryKey: ['broadcasts'],
    queryFn: () => api.get('/broadcasts').then(r => r.data),
  })

  const createMut = useMutation({
    mutationFn: (data: any) => api.post('/broadcasts', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['broadcasts'] })
      setShowForm(false)
      setForm({})
      setEditingBroadcast(null)
      toast.success('Broadcast created')
    },
    onError: () => toast.error('Failed to create broadcast'),
  })

  const updateMut = useMutation({
    mutationFn: (data: any) => api.put(`/broadcasts/${data.id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['broadcasts'] })
      setShowForm(false)
      setForm({})
      setEditingBroadcast(null)
      toast.success('Broadcast updated')
    },
    onError: () => toast.error('Failed to update broadcast'),
  })

  const sendMut = useMutation({
    mutationFn: (id: string) => api.post(`/broadcasts/${id}/send`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['broadcasts'] })
      setConfirmSend(null)
      toast.success('Broadcast sent!')
    },
    onError: () => toast.error('Failed to send broadcast'),
  })

  const scheduleMut = useMutation({
    mutationFn: ({ id, scheduled_at }: { id: string; scheduled_at: string }) =>
      api.post(`/broadcasts/${id}/schedule`, { scheduled_at }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['broadcasts'] })
      setConfirmSchedule(null)
      setScheduleDate('')
      toast.success('Broadcast scheduled!')
    },
    onError: () => toast.error('Failed to schedule broadcast'),
  })

  const deleteMut = useMutation({
    mutationFn: (id: string) => api.delete(`/broadcasts/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['broadcasts'] })
      toast.success('Broadcast deleted')
    },
    onError: () => toast.error('Failed to delete broadcast'),
  })

  const { data: recipients = [], isLoading: recipientsLoading } = useQuery({
    queryKey: ['broadcast-recipients', selectedBroadcast?.id],
    queryFn: () => api.get(`/broadcasts/${selectedBroadcast?.id}/recipients`).then(r => r.data),
    enabled: !!showRecipients && !!selectedBroadcast?.id,
  })

  const { data: stats } = useQuery({
    queryKey: ['broadcast-stats', selectedBroadcast?.id],
    queryFn: () => api.get(`/broadcasts/${selectedBroadcast?.id}/stats`).then(r => r.data),
    enabled: (showStats || showRecipients) && !!selectedBroadcast?.id,
  })

  const openCreate = () => {
    setEditingBroadcast(null)
    setForm({ type: 'email', recipientGroup: '' })
    setShowForm(true)
  }

  const openEdit = (b: Broadcast) => {
    setEditingBroadcast(b)
    setForm({
      subject: b.subject,
      body: b.body,
      type: b.broadcastType,
      recipientGroup: b.recipientGroup,
      templateBody: b.templateBody,
    })
    setShowForm(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.subject || !form.body || !form.type || !form.recipientGroup) {
      toast.error('Please fill all required fields')
      return
    }

    const payload = {
      subject: form.subject,
      body: form.body,
      broadcastType: form.type,
      recipientGroup: form.recipientGroup,
      templateBody: form.templateBody || '',
      scheduled_at: form.scheduledAt || undefined,
    }

    if (editingBroadcast) {
      updateMut.mutate({ ...payload, id: editingBroadcast.id })
    } else {
      createMut.mutate(payload)
    }
  }

  const formatRecipientGroup = (group: string) =>
    group.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#0b3c5d]">Broadcasts</h1>
        <Button onClick={openCreate} className="bg-church-blue hover:bg-church-blue/90">
          <Plus className="size-4 mr-1" /> New Broadcast
        </Button>
      </div>

      {/* Broadcasts List */}
      <Card>
        <CardHeader>
          <CardTitle>All Broadcasts</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Loading />
          ) : broadcasts.length === 0 ? (
            <EmptyState icon={<Radio className="size-10" />} title="No broadcasts yet" description="Create a broadcast to start reaching your congregation." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="p-2">Subject</th>
                    <th className="p-2">Type</th>
                    <th className="p-2">Recipients</th>
                    <th className="p-2">Status</th>
                    <th className="p-2">Created</th>
                    <th className="p-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {broadcasts.map((b: any) => {
                    const cfg = statusConfig[b.status] || statusConfig.draft
                    const StatusIcon = cfg.icon
                    return (
                      <tr key={b.id} className="border-b last:border-0 hover:bg-muted/50">
                        <td className="p-2 font-medium">{b.subject}</td>
                        <td className="p-2">
                          <Badge variant="secondary" className="text-xs gap-1">
                            {b.broadcastType === 'email' ? <Mail className="size-3" /> : <MessageSquare className="size-3" />}
                            {b.broadcastType}
                          </Badge>
                        </td>
                        <td className="p-2 text-muted-foreground text-xs">{formatRecipientGroup(b.recipientGroup || 'all')}</td>
                        <td className="p-2">
                          <Badge variant="secondary" className={`text-xs gap-1 ${cfg.color}`}>
                            <StatusIcon className="size-3" /> {b.status}
                          </Badge>
                        </td>
                        <td className="p-2 text-muted-foreground text-xs">{new Date(b.createdAt).toLocaleDateString()}</td>
                        <td className="p-2 text-right space-x-1">
                          <Button size="sm" variant="outline" onClick={() => { setSelectedBroadcast(b); setShowStats(true) }}>
                            <BarChart3 className="size-3" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => { setSelectedBroadcast(b); setShowRecipients(true) }}>
                            <Users className="size-3" />
                          </Button>
                          {b.status === 'draft' && (
                            <>
                              <Button size="sm" variant="outline" onClick={() => setConfirmSend(b)}>
                                <Send className="size-3 mr-1" /> Send
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => openEdit(b)}>
                                <Edit3 className="size-3 mr-1" /> Edit
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => { setConfirmSchedule(b); setScheduleDate(new Date(Date.now() + 3600000).toISOString().slice(0, 16)) }}>
                                <CalendarClock className="size-3 mr-1" /> Schedule
                              </Button>
                            </>
                          )}
                          {b.status === 'scheduled' && (
                             <Button size="sm" variant="outline" onClick={() => openEdit(b)}>
                               <Edit3 className="size-3 mr-1" /> Edit
                             </Button>
                          )}
                          {(b.status === 'draft' || b.status === 'scheduled') && (
                            <Button size="sm" variant="ghost" onClick={() => { if (confirm(`Delete broadcast "${b.subject}"?`)) deleteMut.mutate(b.id) }}>
                              <Trash2 className="size-3 text-red-500" />
                            </Button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Broadcast Dialog */}
      <Dialog open={showForm} onOpenChange={(open) => {
        if (!open) { setShowForm(false); setEditingBroadcast(null); setForm({}) }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingBroadcast ? 'Edit Broadcast' : 'Create Broadcast'}</DialogTitle>
            <DialogDescription>{editingBroadcast ? 'Update broadcast details.' : 'Compose a new email or SMS broadcast to your congregation.'}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Subject *</Label>
              <Input value={form.subject ?? ''} onChange={e => setForm({ ...form, subject: e.target.value })} placeholder="Broadcast subject" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type *</Label>
                <Select value={form.type ?? 'email'} onValueChange={val => setForm({ ...form, type: val })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="sms">SMS</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Recipient Group *</Label>
                <Select value={form.recipientGroup ?? ''} onValueChange={val => setForm({ ...form, recipientGroup: val })}>
                  <SelectTrigger><SelectValue placeholder="Select recipients" /></SelectTrigger>
                  <SelectContent>
                    {recipientGroups.map(g => (
                      <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Body *</Label>
              <RichTextEditor
                value={form.body || ''}
                onChange={val => setForm({ ...form, body: val })}
                placeholder="Write your message..."
              />
            </div>
            <div className="space-y-2">
              <Label>Template (optional)</Label>
              <Textarea
                value={form.templateBody || ''}
                onChange={e => setForm({ ...form, templateBody: e.target.value })}
                placeholder="HTML template with {{name}} and {{subject}} placeholders. Leave empty to use body as-is."
                rows={4}
              />
              <p className="text-xs text-muted-foreground">Use <code className="bg-gray-100 px-1 rounded text-xs">{'{{name}}'}</code> for recipient name and <code className="bg-gray-100 px-1 rounded text-xs">{'{{subject}}'}</code> for the subject.</p>
            </div>
            <div className="space-y-2">
              <Label>Schedule (optional)</Label>
              <Input
                type="datetime-local"
                value={form.scheduledAt || ''}
                onChange={e => setForm({ ...form, scheduledAt: e.target.value })}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setShowForm(false); setEditingBroadcast(null); setForm({}) }}>Cancel</Button>
              <Button type="submit" disabled={createMut.isPending || updateMut.isPending} className="bg-church-blue hover:bg-church-blue/90">
                {(createMut.isPending || updateMut.isPending) ? 'Saving...' : (editingBroadcast ? 'Update Broadcast' : 'Create Broadcast')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Send Confirmation */}
      <Dialog open={!!confirmSend} onOpenChange={(open) => { if (!open) setConfirmSend(null) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Send Broadcast?</DialogTitle>
            <DialogDescription>
              This will send &quot;{confirmSend?.subject}&quot; to all {formatRecipientGroup(confirmSend?.recipientGroup || 'all_members')}. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmSend(null)}>Cancel</Button>
            <Button onClick={() => confirmSend && sendMut.mutate(confirmSend.id)} disabled={sendMut.isPending} className="bg-church-blue hover:bg-church-blue/90">
              <Send className="size-4 mr-1" /> {sendMut.isPending ? 'Sending...' : 'Send Now'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Schedule Confirmation */}
      <Dialog open={!!confirmSchedule} onOpenChange={(open) => { if (!open) setConfirmSchedule(null) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Schedule Broadcast?</DialogTitle>
            <DialogDescription>
              Schedule &quot;{confirmSchedule?.subject}&quot; for {scheduleDate ? new Date(scheduleDate).toLocaleString() : 'later'}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-4">
            <Label>Schedule Date & Time</Label>
            <Input
              type="datetime-local"
              value={scheduleDate}
              onChange={e => setScheduleDate(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmSchedule(null)}>Cancel</Button>
            <Button onClick={() => {
              if (!confirmSchedule || !scheduleDate) return
              scheduleMut.mutate({ id: confirmSchedule.id, scheduled_at: scheduleDate })
            }} disabled={scheduleMut.isPending} className="bg-church-blue hover:bg-church-blue/90">
              <CalendarClock className="size-4 mr-1" /> {scheduleMut.isPending ? 'Scheduling...' : 'Schedule'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Recipients Dialog */}
      <Dialog open={showRecipients} onOpenChange={(open) => { if (!open) setShowRecipients(false) }}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Recipients - {selectedBroadcast?.subject}</DialogTitle>
            <DialogDescription>
              {stats ? `${stats.total} total | ${stats.sent} sent | ${stats.opened} opened | ${stats.failed} failed` : ''}
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto flex-1">
            {recipientsLoading ? (
              <Loading />
            ) : recipients.length === 0 ? (
              <EmptyState icon={<Users className="size-10" />} title="No recipients yet" description="Recipients will appear after sending." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="p-2">Email</th>
                      <th className="p-2">Name</th>
                      <th className="p-2">Status</th>
                      <th className="p-2">Sent At</th>
                      <th className="p-2">Opened At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recipients.map((r: any) => (
                      <tr key={r.id} className="border-b last:border-0 hover:bg-muted/50">
                        <td className="p-2">{r.recipientEmail}</td>
                        <td className="p-2">{r.recipientName || '-'}</td>
                        <td className="p-2">
                          <Badge variant="secondary" className={`text-xs ${r.status === 'sent' ? 'bg-green-100 text-green-800' : r.status === 'failed' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>
                            {r.status}
                          </Badge>
                        </td>
                        <td className="p-2 text-xs">{r.sentAt ? new Date(r.sentAt).toLocaleString() : '-'}</td>
                        <td className="p-2 text-xs">{r.openedAt ? new Date(r.openedAt).toLocaleString() : <Eye className="size-3 text-gray-400 inline" />}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Stats Dialog */}
      <Dialog open={showStats} onOpenChange={(open) => { if (!open) setShowStats(false) }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delivery Stats - {selectedBroadcast?.subject}</DialogTitle>
          </DialogHeader>
          {stats ? (
            <div className="grid grid-cols-2 gap-4 py-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{stats.total}</div>
                  <div className="text-xs text-muted-foreground">Total Recipients</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-green-600">{stats.sent}</div>
                  <div className="text-xs text-muted-foreground">Sent Successfully</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-blue-600">{stats.opened}</div>
                  <div className="text-xs text-muted-foreground">Opened</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
                  <div className="text-xs text-muted-foreground">Failed</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-gray-600">{stats.pending}</div>
                  <div className="text-xs text-muted-foreground">Pending</div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">Loading stats...</div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}