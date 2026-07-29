'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/admin/api'
import { Plus, Pencil, Trash2, DollarSign, BarChart3, TrendingUp, Calendar } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Loading, TableSkeleton, TableEmpty } from '@/components/LoadingStates'

const offeringTypes = ['general', 'tithe', 'building', 'missions', 'special', 'thanksgiving']

const typeColors: Record<string, string> = {
  general: 'bg-blue-100 text-blue-800',
  tithe: 'bg-green-100 text-green-800',
  building: 'bg-purple-100 text-purple-800',
  missions: 'bg-orange-100 text-orange-800',
  special: 'bg-yellow-100 text-yellow-800',
  thanksgiving: 'bg-pink-100 text-pink-800',
}

function formatNPR(amount: number) {
  return new Intl.NumberFormat('en-NP', { style: 'currency', currency: 'NPR', maximumFractionDigits: 0 }).format(amount)
}

interface OfferingItem {
  denomination: string
  count: number
  amount: number
}

export default function OfferingsPage() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState<Record<string, any>>({})
  const [items, setItems] = useState<OfferingItem[]>([])
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [typeFilter, setTypeFilter] = useState('all')
  const [viewMode, setViewMode] = useState<'list' | 'stats'>('list')

  const { data: offerings = [], isLoading } = useQuery({
    queryKey: ['offerings', typeFilter],
    queryFn: () => {
      const params = new URLSearchParams()
      if (typeFilter !== 'all') params.set('offering_type', typeFilter)
      return api.get(`/offerings?${params}`).then(r => r.data)
    },
  })

  const { data: stats } = useQuery({
    queryKey: ['offerings-stats'],
    queryFn: () => api.get('/offerings/stats').then(r => r.data),
  })

  const { data: offeringDetail } = useQuery({
    queryKey: ['offering-detail', editing?.id],
    queryFn: () => api.get(`/offerings/${editing.id}`).then(r => r.data),
    enabled: !!editing,
  })

  const createMut = useMutation({
    mutationFn: (data: any) => api.post('/offerings', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['offerings'] }); qc.invalidateQueries({ queryKey: ['offerings-stats'] })
      setShowForm(false); setForm({}); setItems([]); toast.success('Offering recorded')
    },
    onError: () => toast.error('Failed to record offering'),
  })

  const updateMut = useMutation({
    mutationFn: ({ id, data }: any) => api.put(`/offerings/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['offerings'] }); qc.invalidateQueries({ queryKey: ['offerings-stats'] })
      setShowForm(false); setEditing(null); setForm({}); setItems([]); toast.success('Offering updated')
    },
  })

  const deleteMut = useMutation({
    mutationFn: (id: string) => api.delete(`/offerings/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['offerings'] }); qc.invalidateQueries({ queryKey: ['offerings-stats'] })
      setConfirmDelete(null); toast.success('Deleted')
    },
  })

  const addItem = () => setItems([...items, { denomination: '', count: 1, amount: 0 }])
  const removeItem = (i: number) => setItems(items.filter((_, idx) => idx !== i))
  const updateItem = (i: number, field: keyof OfferingItem, value: any) => {
    const newItems = [...items]
    ;(newItems[i] as any)[field] = value
    if (field === 'count' || field === 'amount') {
      // Auto-calculate if only one field changed
      if (field === 'count' && newItems[i].amount > 0) {
        // Keep amount per denomination, just update count
      }
    }
    setItems(newItems)
  }

  const totalAmount = items.reduce((sum, item) => sum + (item.amount || 0), 0)

  const openCreate = () => {
    setEditing(null)
    setForm({ serviceDate: new Date().toISOString().split('T')[0], serviceName: 'Sunday Service', offeringType: 'general', currency: 'NPR' })
    setItems([{ denomination: '', count: 1, amount: 0 }])
    setShowForm(true)
  }

  const openEdit = (offering: any) => {
    setEditing(offering)
    setForm({ ...offering, serviceDate: offering.serviceDate ? offering.serviceDate.split('T')[0] : '' })
    setShowForm(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const data = { ...form, totalAmount: totalAmount || form.totalAmount, items: items.filter(i => i.denomination) }
    if (editing) updateMut.mutate({ id: editing.id, data })
    else createMut.mutate(data)
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-lg bg-blue-100 flex items-center justify-center"><DollarSign className="size-5 text-blue-600" /></div>
              <div>
                <div className="text-xl font-bold">{formatNPR(stats?.totalThisMonth ?? 0)}</div>
                <div className="text-xs text-muted-foreground">This Month</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-lg bg-green-100 flex items-center justify-center"><TrendingUp className="size-5 text-green-600" /></div>
              <div>
                <div className="text-xl font-bold">{formatNPR(stats?.totalThisYear ?? 0)}</div>
                <div className="text-xs text-muted-foreground">This Year</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-lg bg-purple-100 flex items-center justify-center"><BarChart3 className="size-5 text-purple-600" /></div>
              <div>
                <div className="text-xl font-bold">{formatNPR(stats?.totalAllTime ?? 0)}</div>
                <div className="text-xs text-muted-foreground">All Time</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-lg bg-orange-100 flex items-center justify-center"><Calendar className="size-5 text-orange-600" /></div>
              <div>
                <div className="text-xl font-bold">{stats?.countThisMonth ?? 0}</div>
                <div className="text-xs text-muted-foreground">Services This Month</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-lg bg-yellow-100 flex items-center justify-center"><DollarSign className="size-5 text-yellow-600" /></div>
              <div>
                <div className="text-xl font-bold">{formatNPR(stats?.avgPerService ?? 0)}</div>
                <div className="text-xs text-muted-foreground">Avg per Service</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* View Tabs */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2 border-b pb-2">
          <button onClick={() => setViewMode('list')} className={`px-4 py-2 rounded-t-lg text-sm font-medium ${viewMode === 'list' ? 'bg-church-blue text-white' : 'text-gray-600 hover:bg-gray-100'}`}>List View</button>
          <button onClick={() => setViewMode('stats')} className={`px-4 py-2 rounded-t-lg text-sm font-medium ${viewMode === 'stats' ? 'bg-church-blue text-white' : 'text-gray-600 hover:bg-gray-100'}`}>Type Breakdown</button>
        </div>
        <div className="flex gap-2">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {offeringTypes.map(t => <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>)}
            </SelectContent>
          </Select>
          <button onClick={openCreate} className="flex items-center gap-1 px-4 py-2 bg-church-blue text-white rounded-lg text-sm hover:bg-church-blue/90">
            <Plus className="size-4" /> Record Offering
          </button>
        </div>
      </div>

      {/* List View */}
      {viewMode === 'list' && (
        <Card>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="p-2">Date</th>
                    <th className="p-2">Service</th>
                    <th className="p-2">Type</th>
                    <th className="p-2 text-right">Amount</th>
                    <th className="p-2">Recorded By</th>
                    <th className="p-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <TableSkeleton rows={5} cols={6} />
                  ) : offerings.length === 0 ? (
                    <TableEmpty colSpan={6} message="No offerings recorded yet" />
                  ) : offerings.map((o: any) => (
                    <tr key={o.id} className="border-b hover:bg-muted/50">
                      <td className="p-2">{o.serviceDate}</td>
                      <td className="p-2 font-medium">{o.serviceName}</td>
                      <td className="p-2"><Badge variant="secondary" className={`text-xs ${typeColors[o.offeringType] || ''}`}>{o.offeringType}</Badge></td>
                      <td className="p-2 text-right font-semibold">{formatNPR(o.totalAmount)}</td>
                      <td className="p-2 text-muted-foreground">{o.recordedBy || '-'}</td>
                      <td className="p-2 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => openEdit(o)} className="p-1 hover:bg-muted rounded"><Pencil className="size-3.5" /></button>
                          <button onClick={() => setConfirmDelete(o.id)} className="p-1 hover:bg-destructive/10 text-destructive rounded"><Trash2 className="size-3.5" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats View */}
      {viewMode === 'stats' && (
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle>By Offering Type</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(stats?.byType ?? []).map((t: any) => (
                  <div key={t.offeringType} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className={`text-xs ${typeColors[t.offeringType] || ''}`}>{t.offeringType}</Badge>
                      <span className="text-sm text-muted-foreground">{t.count} services</span>
                    </div>
                    <span className="font-semibold">{formatNPR(t.total)}</span>
                  </div>
                ))}
                {(!stats?.byType || stats.byType.length === 0) && <p className="text-muted-foreground text-sm">No data yet</p>}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Monthly Trend</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(stats?.monthlyTrend ?? []).map((m: any) => (
                  <div key={m.month} className="flex items-center justify-between">
                    <span className="text-sm font-medium">{m.month}</span>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-muted-foreground">{m.count} services</span>
                      <span className="font-semibold">{formatNPR(m.total)}</span>
                    </div>
                  </div>
                ))}
                {(!stats?.monthlyTrend || stats.monthlyTrend.length === 0) && <p className="text-muted-foreground text-sm">No data yet</p>}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit' : 'Record'} Offering</DialogTitle>
            <DialogDescription>{editing ? 'Update the offering details.' : 'Record a new offering from a service.'}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Service Date *</Label>
                <Input type="date" value={form.serviceDate ?? ''} onChange={e => setForm({ ...form, serviceDate: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Service Name</Label>
                <Input value={form.serviceName ?? ''} onChange={e => setForm({ ...form, serviceName: e.target.value })} placeholder="Sunday Service" />
              </div>
              <div className="space-y-2">
                <Label>Offering Type</Label>
                <Select value={form.offeringType ?? 'general'} onValueChange={val => setForm({ ...form, offeringType: val })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {offeringTypes.map(t => <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Recorded By</Label>
                <Input value={form.recordedBy ?? ''} onChange={e => setForm({ ...form, recordedBy: e.target.value })} placeholder="Who counted?" />
              </div>
            </div>

            {/* Offering Items (Denomination Breakdown) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Denomination Breakdown</Label>
                <button type="button" onClick={addItem} className="text-xs text-church-blue hover:underline">+ Add Row</button>
              </div>
              {items.length > 0 && (
                <div className="space-y-2">
                  <div className="grid grid-cols-12 gap-2 text-xs text-muted-foreground font-medium">
                    <div className="col-span-5">Denomination</div>
                    <div className="col-span-3">Count</div>
                    <div className="col-span-3">Amount (NPR)</div>
                    <div className="col-span-1"></div>
                  </div>
                  {items.map((item, i) => (
                    <div key={i} className="grid grid-cols-12 gap-2">
                      <Input className="col-span-5" value={item.denomination} onChange={e => updateItem(i, 'denomination', e.target.value)} placeholder="Rs 1000" />
                      <Input className="col-span-3" type="number" min="0" value={item.count} onChange={e => updateItem(i, 'count', Number(e.target.value))} />
                      <Input className="col-span-3" type="number" min="0" value={item.amount} onChange={e => updateItem(i, 'amount', Number(e.target.value))} />
                      <button type="button" onClick={() => removeItem(i)} className="col-span-1 text-destructive hover:bg-destructive/10 rounded flex items-center justify-center">x</button>
                    </div>
                  ))}
                  <div className="text-right font-semibold text-sm">Total: {formatNPR(totalAmount)}</div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Total Amount (NPR) *</Label>
              <Input type="number" min="0" value={form.totalAmount ?? totalAmount} onChange={e => setForm({ ...form, totalAmount: Number(e.target.value) })} required />
              {totalAmount > 0 && totalAmount !== form.totalAmount && (
                <p className="text-xs text-muted-foreground">Auto-calculated from breakdown: {formatNPR(totalAmount)}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Input value={form.notes ?? ''} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Any notes about this offering" />
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

      {/* Delete Confirmation */}
      <Dialog open={!!confirmDelete} onOpenChange={(open) => { if (!open) setConfirmDelete(null) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete offering?</DialogTitle>
            <DialogDescription>This will permanently remove the offering record.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => confirmDelete && deleteMut.mutate(confirmDelete)} disabled={deleteMut.isPending}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
