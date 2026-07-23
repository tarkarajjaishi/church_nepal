'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/admin/api'
import { Plus, Pencil, Trash2, DollarSign, Users, RefreshCw } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'
import { Loading, EmptyState } from '@/components/LoadingStates'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function CampaignsPage() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState<Record<string, any>>({})

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['campaigns'],
    queryFn: () => api.get('/campaigns').then(r => (r.data as any).data ?? r.data),
  })

  const { data: statsMap = {}, refetch: refetchStats } = useQuery({
    queryKey: ['campaign-stats', items.map((i: any) => i.id).join(',')],
    queryFn: async () => {
      const map: Record<string, any> = {}
      for (const c of items as any[]) {
        try {
          const { data } = await api.get(`/campaigns/${c.id}/stats`)
          map[c.id] = data
        } catch {
          // stats endpoint may not be ready in all environments
        }
      }
      return map
    },
    enabled: (items as any[]).length > 0,
  })

  const createMut = useMutation({
    mutationFn: (data: any) => api.post('/campaigns', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['campaigns'] }); setShowForm(false); setForm({}); toast.success('Campaign created') },
    onError: () => toast.error('Failed to create campaign'),
  })

  const updateMut = useMutation({
    mutationFn: ({ id, data }: any) => api.put(`/campaigns/${id}`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['campaigns'] }); setShowForm(false); setEditing(null); setForm({}); toast.success('Campaign updated') },
    onError: () => toast.error('Failed to update campaign'),
  })

  const deleteMut = useMutation({
    mutationFn: (id: string) => api.delete(`/campaigns/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['campaigns'] }); toast.success('Campaign deleted') },
    onError: () => toast.error('Failed to delete campaign'),
  })

  const recalcMut = useMutation({
    mutationFn: (id: string) => api.post(`/campaigns/${id}/recalc-raised`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['campaigns'] }); refetchStats(); toast.success('Progress recalculated') },
    onError: () => toast.error('Failed to recalculate'),
  })

  const openCreate = () => { setEditing(null); setForm({ goal: 0 }); setShowForm(true) }
  const openEdit = (item: any) => { setEditing(item); setForm({ ...item }); setShowForm(true) }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editing) updateMut.mutate({ id: editing.id, data: form })
    else createMut.mutate(form)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0b3c5d]">Campaigns</h1>
          <p className="text-sm text-muted-foreground">Track fundraising goals and progress</p>
        </div>
        <Button onClick={openCreate} className="bg-church-blue hover:bg-church-blue/90">
          <Plus className="size-4 mr-1" /> New Campaign
        </Button>
      </div>

      {isLoading ? (
        <Loading />
      ) : items.length === 0 ? (
        <EmptyState icon={<Target className="size-10" />} title="No campaigns yet" description="Create your first fundraising campaign." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(items as any[]).map((item: any) => {
            const stats = statsMap[item.id] || {}
            const pct = Math.round(((stats.raised || item.raised || 0) / (item.goal || 1)) * 100)
            const pledgePct = Math.round((stats.pledge_amount || 0) / (item.goal || 1) * 100)

            return (
              <Card key={item.id} className="border-border/60">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-base text-[#0b3c5d]">{item.title}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={item.enabled !== false ? 'default' : 'secondary'}>
                          {item.enabled !== false ? 'Active' : 'Draft'}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button size="sm" variant="ghost" onClick={() => recalcMut.mutate(item.id)} title="Recalculate progress">
                        <RefreshCw className={`size-4 ${recalcMut.isPending ? 'animate-spin' : ''}`} />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => openEdit(item)}>
                        <Pencil className="size-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => { if (confirm('Delete this campaign?')) deleteMut.mutate(item.id) }}>
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Progress bar */}
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-semibold text-church-blue">{pct}%</span>
                    </div>
                    <Progress value={pct} className="h-2" />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>Rs {(item.raised || 0).toLocaleString()} raised</span>
                      <span>Rs {item.goal?.toLocaleString() || '0'} goal</span>
                    </div>
                  </div>

                  {/* Stats grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg bg-green-50 border border-green-100">
                      <div className="flex items-center gap-2 text-green-700 mb-1">
                        <DollarSign className="size-4" />
                        <span className="text-xs font-medium">Donations</span>
                      </div>
                      <div className="text-lg font-bold text-green-900">Rs {(stats.donation_amount || 0).toLocaleString()}</div>
                      <div className="text-xs text-green-700">{stats.donation_count || 0} payments</div>
                    </div>
                    <div className="p-3 rounded-lg bg-blue-50 border border-blue-100">
                      <div className="flex items-center gap-2 text-blue-700 mb-1">
                        <Users className="size-4" />
                        <span className="text-xs font-medium">Pledges</span>
                      </div>
                      <div className="text-lg font-bold text-blue-900">Rs {(stats.pledge_amount || 0).toLocaleString()}</div>
                      <div className="text-xs text-blue-700">{stats.pledge_count || 0} committed</div>
                    </div>
                  </div>

                  {/* Pledge progress */}
                  {item.goal > 0 && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Pledged toward goal</span>
                        <span className="font-medium">{pledgePct}%</span>
                      </div>
                      <Progress value={pledgePct} className="h-1.5" />
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit' : 'Create'} Campaign</DialogTitle>
            <DialogDescription>{editing ? 'Update campaign details.' : 'Set up a new fundraising campaign.'}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input value={form.title ?? ''} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Campaign name" required />
            </div>
            <div className="space-y-2">
              <Label>Goal (Rs) *</Label>
              <Input type="number" min="0" value={form.goal ?? ''} onChange={e => setForm({ ...form, goal: Number(e.target.value) })} required />
            </div>
            <div className="space-y-2">
              <Label>Initial Raised (Rs)</Label>
              <Input type="number" min="0" value={form.raised ?? ''} onChange={e => setForm({ ...form, raised: Number(e.target.value) })} />
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
