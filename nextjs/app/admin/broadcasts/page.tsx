'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/admin/api'
import { Plus, Send, Radio, Mail, MessageSquare, Clock, CheckCircle2, AlertCircle } from 'lucide-react'
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

const statusConfig: Record<string, { color: string; icon: any }> = {
  draft: { color: 'bg-gray-100 text-gray-800', icon: Clock },
  sent: { color: 'bg-green-100 text-green-800', icon: CheckCircle2 },
  scheduled: { color: 'bg-blue-100 text-blue-800', icon: Clock },
  failed: { color: 'bg-red-100 text-red-800', icon: AlertCircle },
}

const recipientGroups = ['all_members', 'active_members', 'visitors', 'volunteers', 'small_groups']

export default function BroadcastsPage() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Record<string, any>>({})
  const [confirmSend, setConfirmSend] = useState<any>(null)

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
      toast.success('Broadcast created')
    },
    onError: () => toast.error('Failed to create broadcast'),
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createMut.mutate(form)
  }

  const formatRecipientGroup = (group: string) =>
    group.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#0b3c5d]">Broadcasts</h1>
        <Button onClick={() => { setForm({ type: 'email' }); setShowForm(true) }} className="bg-church-blue hover:bg-church-blue/90">
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
                            {b.type === 'email' ? <Mail className="size-3" /> : <MessageSquare className="size-3" />}
                            {b.type}
                          </Badge>
                        </td>
                        <td className="p-2 text-muted-foreground text-xs">{formatRecipientGroup(b.recipientGroup || 'all_members')}</td>
                        <td className="p-2">
                          <Badge variant="secondary" className={`text-xs gap-1 ${cfg.color}`}>
                            <StatusIcon className="size-3" /> {b.status}
                          </Badge>
                        </td>
                        <td className="p-2 text-muted-foreground text-xs">{new Date(b.createdAt).toLocaleDateString()}</td>
                        <td className="p-2 text-right">
                          {b.status === 'draft' && (
                            <Button size="sm" variant="outline" onClick={() => setConfirmSend(b)}>
                              <Send className="size-3 mr-1" /> Send
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

      {/* Create Broadcast Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Broadcast</DialogTitle>
            <DialogDescription>Compose a new email or SMS broadcast.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Subject *</Label>
              <Input value={form.subject ?? ''} onChange={e => setForm({ ...form, subject: e.target.value })} placeholder="Broadcast subject" required />
            </div>
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
                    <SelectItem key={g} value={g}>{formatRecipientGroup(g)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Body *</Label>
              <Textarea value={form.body ?? ''} onChange={e => setForm({ ...form, body: e.target.value })} placeholder="Write your message..." rows={6} required />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button type="submit" disabled={createMut.isPending} className="bg-church-blue hover:bg-church-blue/90">
                {createMut.isPending ? 'Creating...' : 'Create Broadcast'}
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
    </div>
  )
}
