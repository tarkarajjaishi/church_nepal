'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/admin/api'
import { Users, CheckCircle, XCircle, Clock, Eye, Trash2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Loading, TableSkeleton, TableEmpty } from '@/components/LoadingStates'

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
}

export default function MemberApplicationsPage() {
  const qc = useQueryClient()
  const [selected, setSelected] = useState<any>(null)
  const [reviewNotes, setReviewNotes] = useState('')
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const { data: applications = [], isLoading } = useQuery({
    queryKey: ['member-applications'],
    queryFn: () => api.get('/member-applications').then(r => r.data),
  })

  const { data: stats } = useQuery({
    queryKey: ['member-applications-stats'],
    queryFn: () => api.get('/member-applications/stats').then(r => r.data),
  })

  const updateMut = useMutation({
    mutationFn: ({ id, data }: any) => api.put(`/member-applications/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['member-applications'] }); qc.invalidateQueries({ queryKey: ['member-applications-stats'] })
      setSelected(null); setReviewNotes(''); toast.success('Application updated')
    },
  })

  const deleteMut = useMutation({
    mutationFn: (id: string) => api.delete(`/member-applications/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['member-applications'] }); qc.invalidateQueries({ queryKey: ['member-applications-stats'] })
      setConfirmDelete(null); toast.success('Deleted')
    },
  })

  const handleApprove = (app: any) => {
    updateMut.mutate({ id: app.id, data: { status: 'approved', notes: reviewNotes } })
  }

  const handleReject = (app: any) => {
    updateMut.mutate({ id: app.id, data: { status: 'rejected', notes: reviewNotes } })
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Applications', value: stats?.total ?? 0, icon: Users, color: 'text-church-blue' },
          { label: 'Pending Review', value: stats?.pending ?? 0, icon: Clock, color: 'text-yellow-600' },
          { label: 'Approved', value: stats?.approved ?? 0, icon: CheckCircle, color: 'text-green-600' },
          { label: 'This Month', value: stats?.this_month ?? 0, icon: Users, color: 'text-purple-600' },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <s.icon className={`size-5 ${s.color}`} />
                <div>
                  <div className="text-2xl font-bold">{s.value}</div>
                  <div className="text-xs text-muted-foreground">{s.label}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Applications Table */}
      <Card>
        <CardHeader>
          <CardTitle>Member Applications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="p-2">Name</th>
                  <th className="p-2">Email</th>
                  <th className="p-2">Phone</th>
                  <th className="p-2">City</th>
                  <th className="p-2">Status</th>
                  <th className="p-2">Applied</th>
                  <th className="p-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <TableSkeleton rows={5} cols={7} />
                ) : applications.length === 0 ? (
                  <TableEmpty colSpan={7} message="No applications yet" />
                ) : applications.map((app: any) => (
                  <tr key={app.id} className="border-b hover:bg-muted/50 cursor-pointer" onClick={() => { setSelected(app); setReviewNotes(app.notes || '') }}>
                    <td className="p-2 font-medium">{app.firstName} {app.lastName}</td>
                    <td className="p-2 text-muted-foreground">{app.email}</td>
                    <td className="p-2 text-muted-foreground">{app.phone || '-'}</td>
                    <td className="p-2 text-muted-foreground">{app.city || '-'}</td>
                    <td className="p-2">
                      <Badge variant="secondary" className={`text-xs ${statusColors[app.status] || ''}`}>{app.status}</Badge>
                    </td>
                    <td className="p-2 text-muted-foreground text-xs">{new Date(app.createdAt).toLocaleDateString()}</td>
                    <td className="p-2 text-right" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => { setSelected(app); setReviewNotes(app.notes || '') }} className="p-1 hover:bg-muted rounded"><Eye className="size-3.5" /></button>
                        <button onClick={() => setConfirmDelete(app.id)} className="p-1 hover:bg-destructive/10 text-destructive rounded"><Trash2 className="size-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!selected} onOpenChange={(open) => { if (!open) setSelected(null) }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>{selected.firstName} {selected.lastName}</DialogTitle>
                <DialogDescription>
                  <Badge variant="secondary" className={`text-xs ${statusColors[selected.status] || ''}`}>{selected.status}</Badge>
                  <span className="ml-2 text-xs text-muted-foreground">Applied {new Date(selected.createdAt).toLocaleDateString()}</span>
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-muted-foreground">Email:</span> {selected.email}</div>
                  <div><span className="text-muted-foreground">Phone:</span> {selected.phone || '-'}</div>
                  <div><span className="text-muted-foreground">City:</span> {selected.city || '-'}</div>
                  <div><span className="text-muted-foreground">Gender:</span> {selected.gender || '-'}</div>
                  <div><span className="text-muted-foreground">Marital Status:</span> {selected.maritalStatus || '-'}</div>
                  <div><span className="text-muted-foreground">Baptism:</span> {selected.baptismStatus || '-'}</div>
                </div>

                {selected.howFound && <div className="text-sm"><span className="text-muted-foreground">How found us:</span> {selected.howFound}</div>}
                {selected.interestAreas && <div className="text-sm"><span className="text-muted-foreground">Interests:</span> {selected.interestAreas}</div>}
                {selected.churchBackground && (
                  <div className="text-sm"><span className="text-muted-foreground">Church Background:</span><p className="mt-1">{selected.churchBackground}</p></div>
                )}
                {selected.testimony && (
                  <div className="text-sm"><span className="text-muted-foreground">Testimony:</span><p className="mt-1 italic">"{selected.testimony}"</p></div>
                )}

                {/* Review Notes */}
                <div className="space-y-2">
                  <Label>Review Notes</Label>
                  <Textarea value={reviewNotes} onChange={e => setReviewNotes(e.target.value)} rows={3} placeholder="Add notes about this application..." />
                </div>
              </div>

              <DialogFooter className="gap-2">
                {selected.status === 'pending' && (
                  <>
                    <Button variant="destructive" onClick={() => handleReject(selected)} disabled={updateMut.isPending}>
                      <XCircle className="size-4 mr-1" /> Reject
                    </Button>
                    <Button onClick={() => handleApprove(selected)} disabled={updateMut.isPending} className="bg-green-600 hover:bg-green-700">
                      <CheckCircle className="size-4 mr-1" /> Approve
                    </Button>
                  </>
                )}
                {selected.status !== 'pending' && (
                  <Button variant="outline" onClick={() => updateMut.mutate({ id: selected.id, data: { status: 'pending', notes: reviewNotes } })}>
                    Reset to Pending
                  </Button>
                )}
                <Button variant="outline" onClick={() => setSelected(null)}>Close</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!confirmDelete} onOpenChange={(open) => { if (!open) setConfirmDelete(null) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete application?</DialogTitle>
            <DialogDescription>This cannot be undone.</DialogDescription>
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
