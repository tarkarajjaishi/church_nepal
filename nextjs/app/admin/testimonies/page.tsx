'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/admin/api'
import { Quote, Star, CheckCircle, XCircle, Trash2, Eye } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
}

export default function AdminTestimoniesPage() {
  const qc = useQueryClient()
  const [statusFilter, setStatusFilter] = useState('all')
  const [selected, setSelected] = useState<any>(null)
  const [showDetail, setShowDetail] = useState(false)
  const [showDelete, setShowDelete] = useState<string | null>(null)

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['testimonies', 'admin'],
    queryFn: async () => {
      const { data } = await api.get('/testimonies')
      return Array.isArray(data) ? data : data.data ?? []
    },
  })

  const approveMut = useMutation({
    mutationFn: (id: string) => api.put(`/testimonies/${id}/approve`).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['testimonies'] })
      toast.success('Testimony approved')
    },
  })

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.put(`/testimonies/${id}`, data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['testimonies'] })
      toast.success('Testimony updated')
    },
  })

  const deleteMut = useMutation({
    mutationFn: (id: string) => api.delete(`/testimonies/${id}`).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['testimonies'] })
      setShowDelete(null)
      toast.success('Testimony deleted')
    },
  })

  const filtered = items.filter((t: any) => {
    if (statusFilter === 'all') return true
    return t.status === statusFilter
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#0b3c5d] flex items-center gap-2">
          <Quote className="size-6" />
          Testimonies
        </h1>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{filtered.length} testimonies</span>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Status:</span>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 text-sm border rounded-md bg-background"
            >
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-6 border-border/60 h-full animate-pulse">
              <div className="h-4 bg-muted rounded w-3/4 mb-4"></div>
              <div className="h-3 bg-muted rounded w-full mb-2"></div>
              <div className="h-3 bg-muted rounded w-5/6"></div>
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">No testimonies found.</p>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((item: any) => (
            <Card key={item.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Badge className={`text-xs ${statusColors[item.status] || statusColors.pending}`}>
                      {item.status || 'pending'}
                    </Badge>
                    {item.enabled !== false && (
                      <Badge variant="secondary" className="text-xs">On</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {item.status !== 'approved' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => approveMut.mutate(item.id)}
                        disabled={approveMut.isPending}
                        title="Approve"
                      >
                        <CheckCircle className="size-3.5 text-green-600" />
                      </Button>
                    )}
                    {item.status === 'approved' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => updateMut.mutate({ id: item.id, data: { status: 'pending' } })}
                        title="Unapprove"
                      >
                        <XCircle className="size-3.5 text-yellow-600" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => updateMut.mutate({ id: item.id, data: { enabled: item.enabled === false } })}
                      title={item.enabled !== false ? 'Disable' : 'Enable'}
                    >
                      <Eye className="size-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setShowDelete(item.id)}
                      title="Delete"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>

                <p className="text-sm text-foreground/80 line-clamp-3 mb-3">"{item.quote}"</p>

                <div className="flex items-center gap-3">
                  <div className="flex gap-0.5" aria-label={`${item.rating} out of 5 stars`}>
                    {Array.from({ length: item.rating }).map((_: any, k: number) => (
                      <Star key={k} className="size-3.5 fill-gold text-gold" />
                    ))}
                  </div>
                  <div>
                    <div className="text-xs font-medium text-church-blue">{item.name}</div>
                    <div className="text-[10px] text-muted-foreground">{item.role}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={showDetail} onOpenChange={setShowDetail}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Testimony Details</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div>
                <Label>Name</Label>
                <p className="mt-1 text-sm">{selected.name}</p>
              </div>
              <div>
                <Label>Role</Label>
                <p className="mt-1 text-sm">{selected.role}</p>
              </div>
              <div>
                <Label>Quote</Label>
                <p className="mt-1 p-3 bg-muted/50 rounded-lg text-sm">"{selected.quote}"</p>
              </div>
              <div>
                <Label>Image URL</Label>
                <p className="mt-1 text-sm truncate">{selected.image}</p>
              </div>
              <div>
                <Label>Rating</Label>
                <p className="mt-1 text-sm">{selected.rating} / 5</p>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setShowDetail(false)}>Close</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!showDelete} onOpenChange={(open) => { if (!open) setShowDelete(null) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete testimony?</DialogTitle>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDelete(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => showDelete && deleteMut.mutate(showDelete)} disabled={deleteMut.isPending}>
              {deleteMut.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
