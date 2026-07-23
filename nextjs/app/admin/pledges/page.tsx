'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/admin/api'
import { Plus, Pencil, Target, DollarSign, User } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Loading, EmptyState } from '@/components/LoadingStates'

const statusOptions = ['active', 'fulfilled', 'cancelled', 'overdue']

const statusColors: Record<string, string> = {
  active: 'bg-blue-100 text-blue-800',
  fulfilled: 'bg-green-100 text-green-800',
  cancelled: 'bg-gray-100 text-gray-800',
  overdue: 'bg-red-100 text-red-800',
}

export default function PledgesPage() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState<Record<string, any>>({})
  const [statusFilter, setStatusFilter] = useState('all')

  const { data: pledges = [], isLoading } = useQuery({
    queryKey: ['pledges', statusFilter],
    queryFn: () => {
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.set('status', statusFilter)
      return api.get(`/pledges${params.toString() ? '?' + params.toString() : ''}`).then(r => r.data)
    },
  })

  const { data: campaigns = [] } = useQuery({
    queryKey: ['campaigns'],
    queryFn: () => api.get('/campaigns').then(r => r.data),
  })

  const campaignMap = Object.fromEntries((campaigns as any[]).map((c: any) => [c.id, c.title]))

  const createMut = useMutation({
    mutationFn: (data: any) => api.post('/pledges', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['pledges'] }); setShowForm(false); setForm({}); toast.success('Pledge created') },
    onError: () => toast.error('Failed to create pledge'),
  })

  const updateMut = useMutation({
    mutationFn: ({ id, data }: any) => api.put(`/pledges/${id}`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['pledges'] }); setShowForm(false); setEditing(null); setForm({}); toast.success('Pledge updated') },
    onError: () => toast.error('Failed to update pledge'),
  })

  const toggleStatusMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => api.put(`/pledges/${id}`, { status }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['pledges'] }); toast.success('Status updated') },
  })

  const openCreate = () => { setEditing(null); setForm({ status: 'active' }); setShowForm(true) }
  const openEdit = (pledge: any) => { setEditing(pledge); setForm({ ...pledge }); setShowForm(true) }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editing) updateMut.mutate({ id: editing.id, data: form })
    else createMut.mutate(form)
  }

  const totalPledged = pledges.reduce((sum: number, p: any) => sum + (p.amount || 0), 0)
  const activePledges = pledges.filter((p: any) => p.status === 'active')
  const fulfilledPledges = pledges.filter((p: any) => p.status === 'fulfilled')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#0b3c5d]">Pledges</h1>
        <Button onClick={openCreate} className="bg-church-blue hover:bg-church-blue/90">
          <Plus className="size-4 mr-1" /> New Pledge
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Pledged', value: `Rs ${totalPledged.toLocaleString()}`, icon: DollarSign, color: 'bg-green-500' },
          { label: 'Active Pledges', value: activePledges.length, icon: Target, color: 'bg-blue-500' },
          { label: 'Fulfilled', value: fulfilledPledges.length, icon: Target, color: 'bg-purple-500' },
          { label: 'Total Pledges', value: pledges.length, icon: User, color: 'bg-orange-500' },
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

      {/* Filter */}
      <div className="flex items-center gap-2">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {statusOptions.map(s => <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Pledges Table */}
      <Card>
        <CardContent>
          {isLoading ? (
            <Loading />
          ) : pledges.length === 0 ? (
            <EmptyState icon={<Target className="size-10" />} title="No pledges found" description="Pledges will appear here once created." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="p-2">Person</th>
                    <th className="p-2">Email</th>
                    <th className="p-2">Campaign</th>
                    <th className="p-2 text-right">Amount</th>
                    <th className="p-2">Status</th>
                    <th className="p-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pledges.map((p: any) => (
                    <tr key={p.id} className="border-b last:border-0 hover:bg-muted/50">
                      <td className="p-2 font-medium">{p.personName || p.name || '-'}</td>
                      <td className="p-2 text-muted-foreground text-xs">{p.personEmail || p.email || '-'}</td>
                       <td className="p-2 text-muted-foreground">{campaignMap[p.campaignId] || '-'}</td>
                      <td className="p-2 text-right font-semibold">Rs {(p.amount || 0).toLocaleString()}</td>
                      <td className="p-2">
                        <Badge variant="secondary" className={`text-xs ${statusColors[p.status] || ''}`}>{p.status}</Badge>
                      </td>
                      <td className="p-2 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button size="sm" variant="ghost" onClick={() => openEdit(p)}>
                            <Pencil className="size-3.5" />
                          </Button>
                          {p.status === 'active' && (
                            <Button size="sm" variant="ghost" onClick={() => toggleStatusMut.mutate({ id: p.id, status: 'fulfilled' })}>
                              Mark Fulfilled
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit' : 'Create'} Pledge</DialogTitle>
            <DialogDescription>{editing ? 'Update pledge details.' : 'Record a new pledge commitment.'}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Person Name *</Label>
              <Input value={form.personName ?? form.name ?? ''} onChange={e => setForm({ ...form, personName: e.target.value })} placeholder="Donor name" required />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={form.personEmail ?? form.email ?? ''} onChange={e => setForm({ ...form, personEmail: e.target.value })} placeholder="donor@email.com" />
            </div>
            <div className="space-y-2">
              <Label>Campaign</Label>
              <Select value={form.campaignId ?? ''} onValueChange={val => setForm({ ...form, campaignId: val })}>
                <SelectTrigger><SelectValue placeholder="Select campaign" /></SelectTrigger>
                <SelectContent>
                  {campaigns.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Amount (Rs) *</Label>
              <Input type="number" min="0" value={form.amount ?? ''} onChange={e => setForm({ ...form, amount: Number(e.target.value) })} required />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.status ?? 'active'} onValueChange={val => setForm({ ...form, status: val })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {statusOptions.map(s => <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button type="submit" disabled={createMut.isPending || updateMut.isPending} className="bg-church-blue hover:bg-church-blue/90">
                {createMut.isPending || updateMut.isPending ? 'Saving...' : 'Save'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
