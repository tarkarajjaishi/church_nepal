'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/admin/api'
import { Users, Search, Trash2, Calendar } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Loading, EmptyState, TableEmpty } from '@/components/LoadingStates'
import type { EventRsvp } from '@/lib/hooks/event-rsvps'
import type { ChurchEvent } from '@/lib/hooks/events'

export default function AdminRsvpsPage() {
  const qc = useQueryClient()
  const [selectedEventId, setSelectedEventId] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const { data: events = [] } = useQuery<ChurchEvent[]>({
    queryKey: ['events'],
    queryFn: () => api.get<ChurchEvent[]>('/events').then(r => r.data),
  })

  const { data: rsvps = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['events', selectedEventId, 'rsvps'],
    queryFn: () => api.get<EventRsvp[]>(`/events/${selectedEventId}/rsvps`).then(r => r.data),
    enabled: !!selectedEventId,
  })

  const deleteMut = useMutation({
    mutationFn: (id: string) => api.delete(`/rsvps/${id}`),
    onSuccess: () => {
      toast.success('RSVP deleted')
      setDeleteId(null)
      void qc.invalidateQueries({ predicate: (q: any) => Array.isArray(q.queryKey) && q.queryKey[0] === 'events' })
    },
    onError: () => toast.error('Failed to delete RSVP'),
  })

  const filteredRsvps = rsvps.filter((r: EventRsvp) =>
    !searchQuery ||
    r.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.email?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#0b3c5d]">Event RSVPs</h1>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="space-y-1 flex-1">
              <Label>Select Event</Label>
              <Select value={selectedEventId} onValueChange={setSelectedEventId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose an event" />
                </SelectTrigger>
                <SelectContent>
                  {events.map((ev) => (
                    <SelectItem key={ev.id} value={ev.id}>{ev.title} — {ev.displayDate}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1 sm:w-72">
              <Label>Search</Label>
              <div className="relative">
                <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <Input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Name or email..."
                  className="pl-9"
                  disabled={!selectedEventId}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {!selectedEventId ? (
        <EmptyState
          icon={<Calendar className="size-10" />}
          title="No event selected"
          description="Select an event above to view its RSVPs."
        />
      ) : isError ? (
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-destructive text-center">Failed to load RSVPs. Try refreshing the page.</p>
            <div className="text-center mt-2">
              <Button variant="outline" onClick={() => refetch()}>Retry</Button>
            </div>
          </CardContent>
        </Card>
      ) : isLoading ? (
        <Loading message="Loading RSVPs..." />
      ) : filteredRsvps.length === 0 ? (
        <Card>
          <CardContent className="p-0 overflow-hidden">
            <TableEmpty colSpan={5} message={searchQuery ? 'No matching RSVPs found' : 'No RSVPs yet for this event'} />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="size-4" /> RSVPs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Guests</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRsvps.map((r: EventRsvp) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.name}</TableCell>
                      <TableCell className="text-muted-foreground">{r.email}</TableCell>
                      <TableCell>{r.guests}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={r.status === 'waitlist' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}>
                          {r.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '-'}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteId(r.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={!!deleteId} onOpenChange={(open) => { if (!open) setDeleteId(null) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete RSVP?</DialogTitle>
            <DialogDescription>This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deleteId && deleteMut.mutate(deleteId)} disabled={deleteMut.isPending}>
              {deleteMut.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
