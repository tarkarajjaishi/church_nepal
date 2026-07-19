'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/admin/api'
import { Plus, Pencil, Wallet, ToggleLeft, ToggleRight } from 'lucide-react'
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

const fundTypes = ['general', 'building', 'missions', 'benevolence', 'youth', 'worship', 'admin']

export default function FundsPage() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState<Record<string, any>>({})

  const { data: funds = [], isLoading } = useQuery({
    queryKey: ['funds'],
    queryFn: () => api.get('/funds').then(r => r.data),
  })

  const createMut = useMutation({
    mutationFn: (data: any) => api.post('/funds', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['funds'] }); setShowForm(false); setForm({}); toast.success('Fund created') },
    onError: () => toast.error('Failed to create fund'),
  })

  const updateMut = useMutation({
    mutationFn: ({ id, data }: any) => api.put(`/funds/${id}`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['funds'] }); setShowForm(false); setEditing(null); setForm({}); toast.success('Fund updated') },
    onError: () => toast.error('Failed to update fund'),
  })

  const toggleMut = useMutation({
    mutationFn: (id: string) => api.put(`/funds/${id}/toggle`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['funds'] }); toast.success('Fund status toggled') },
  })

  const openCreate = () => { setEditing(null); setForm({ type: 'general', isActive: true }); setShowForm(true) }
  const openEdit = (fund: any) => { setEditing(fund); setForm({ ...fund }); setShowForm(true) }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editing) updateMut.mutate({ id: editing.id, data: form })
    else createMut.mutate(form)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#0b3c5d]">Funds</h1>
        <Button onClick={openCreate} className="bg-church-blue hover:bg-church-blue/90">
          <Plus className="size-4 mr-1" /> New Fund
        </Button>
      </div>

      {/* Funds List */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="md:col-span-2 lg:col-span-3"><Loading /></div>
        ) : funds.length === 0 ? (
          <div className="md:col-span-2 lg:col-span-3"><EmptyState icon={<Wallet className="size-10" />} title="No funds yet" description="Create a fund to start tracking donations." /></div>
        ) : funds.map((fund: any) => (
          <Card key={fund.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Wallet className="size-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{fund.name}</h3>
                    <p className="text-xs text-muted-foreground capitalize">{fund.type || 'general'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => toggleMut.mutate(fund.id)} className="p-1 hover:bg-muted rounded">
                    {fund.isActive ? <ToggleRight className="size-5 text-green-600" /> : <ToggleLeft className="size-5 text-muted-foreground" />}
                  </button>
                  <button onClick={() => openEdit(fund)} className="p-1 hover:bg-muted rounded">
                    <Pencil className="size-3.5" />
                  </button>
                </div>
              </div>
              {fund.description && <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{fund.description}</p>}
              <div className="mt-3 flex items-center justify-between">
                <Badge variant="secondary" className={fund.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                  {fund.isActive ? 'Active' : 'Inactive'}
                </Badge>
                {fund.balance !== undefined && (
                  <span className="text-sm font-semibold">Rs {(fund.balance || 0).toLocaleString()}</span>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit' : 'Create'} Fund</DialogTitle>
            <DialogDescription>{editing ? 'Update fund details.' : 'Create a new fund for tracking donations.'}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Fund Name *</Label>
              <Input value={form.name ?? ''} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Building Fund" required />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={form.type ?? 'general'} onValueChange={val => setForm({ ...form, type: val })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {fundTypes.map(t => <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={form.description ?? ''} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="What is this fund for?" rows={3} />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.isActive !== false ? 'true' : 'false'} onValueChange={val => setForm({ ...form, isActive: val === 'true' })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Active</SelectItem>
                  <SelectItem value="false">Inactive</SelectItem>
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
