'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/admin/api'
import { Search, Filter, HandHeart, CheckCircle, Clock, Archive, Eye, Trash2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Loading, EmptyState } from '@/components/LoadingStates'

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  answered: 'bg-green-100 text-green-800',
  archived: 'bg-gray-100 text-gray-800',
}

const categoryColors: Record<string, string> = {
  Health: 'bg-red-100 text-red-800',
  Family: 'bg-blue-100 text-blue-800',
  Financial: 'bg-green-100 text-green-800',
  Spiritual: 'bg-purple-100 text-purple-800',
  Other: 'bg-gray-100 text-gray-800',
}

export default function PrayerRequestsPage() {
  const qc = useQueryClient()
  const [statusFilter, setStatusFilter] = useState('pending')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedRequest, setSelectedRequest] = useState<any>(null)
  const [showPrayerNote, setShowPrayerNote] = useState(false)
  const [prayerNote, setPrayerNote] = useState('')

  // Query for prayer requests (filter by message_type = 'prayer')
  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['prayer-requests', statusFilter, categoryFilter],
    queryFn: () => {
      const params = new URLSearchParams()
      params.set('message_type', 'prayer')
      params.set('status', statusFilter)
      if (categoryFilter !== 'all') params.set('category', categoryFilter)
      return api.get(`/contact-messages?${params.toString()}`).then(r => r.data)
    },
  })

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.put(`/contact-messages/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['prayer-requests'] })
      setShowPrayerNote(false)
      setPrayerNote('')
      toast.success('Prayer request updated')
    },
  })

  const filtered = requests.filter((r: any) =>
    !searchQuery ||
    r.message?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (r.name || '').toLowerCase().includes(searchQuery.toLowerCase())
  )

  const categories = [...new Set(requests.map((r: any) => r.category).filter(Boolean))] as string[]

  const markAnswered = (request: any) => {
    if (request.status === 'answered') {
      toast('Already marked as answered')
      return
    }
    setSelectedRequest(request)
    setShowPrayerNote(true)
  }

  const handleSaveNote = () => {
    if (!selectedRequest) return
    updateMut.mutate({
      id: selectedRequest.id,
      data: {
        status: 'answered',
        notes: prayerNote,
        answered_at: new Date().toISOString(),
      },
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#0b3c5d] flex items-center gap-2">
          <HandHeart className="size-6" />
          Prayer Requests
        </h1>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{filtered.length} requests</span>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Filter className="size-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filters:</span>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="answered">Answered</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(c => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="relative">
              <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search requests..."
                className="pl-9 w-64"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Requests Grid */}
      {isLoading ? (
        <Loading />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<HandHeart className="size-10" />}
          title="No prayer requests found"
          description="Prayer requests submitted by visitors will appear here."
        />
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((request: any) => (
            <Card key={request.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {request.category && (
                      <Badge variant="secondary" className={`text-xs ${categoryColors[request.category] || categoryColors.Other}`}>
                        {request.category}
                      </Badge>
                    )}
                    <Badge variant="secondary" className={`text-xs ${statusColors[request.status] || statusColors.pending}`}>
                      {request.status || 'pending'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1">
                    {request.status !== 'answered' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => markAnswered(request)}
                        title="Mark as answered"
                      >
                        <CheckCircle className="size-3.5" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setSelectedRequest(request)}
                      title="View details"
                    >
                      <Eye className="size-3.5" />
                    </Button>
                  </div>
                </div>

                <p className="text-sm text-foreground/80 line-clamp-3 mb-3">
                  "{request.message}"
                </p>

                <div className="space-y-1 text-xs text-muted-foreground">
                  {!request.anonymous && (
                    <div>From: {request.name || 'Anonymous'}</div>
                  )}
                  {request.email && <div>{request.email}</div>}
                  <div className="flex items-center gap-1">
                    <Clock className="size-3" />
                    {new Date(request.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={!!selectedRequest && !showPrayerNote} onOpenChange={() => setSelectedRequest(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Prayer Request Details</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div>
                <Label>Request</Label>
                <p className="mt-1 p-3 bg-muted/50 rounded-lg text-sm">"{selectedRequest.message}"</p>
              </div>
              {!selectedRequest.anonymous && selectedRequest.name && (
                <div>
                  <Label>From</Label>
                  <p className="mt-1 text-sm">{selectedRequest.name}</p>
                </div>
              )}
              {selectedRequest.email && (
                <div>
                  <Label>Email</Label>
                  <p className="mt-1 text-sm">{selectedRequest.email}</p>
                </div>
              )}
              {selectedRequest.category && (
                <div>
                  <Label>Category</Label>
                  <div className="mt-1">
                    <Badge className={categoryColors[selectedRequest.category] || categoryColors.Other}>
                      {selectedRequest.category}
                    </Badge>
                  </div>
                </div>
              )}
              {selectedRequest.notes && (
                <div>
                  <Label>Notes</Label>
                  <p className="mt-1 text-sm">{selectedRequest.notes}</p>
                </div>
              )}
              <div className="flex justify-end gap-2 pt-2">
                {selectedRequest.status !== 'answered' && (
                  <Button onClick={() => setShowPrayerNote(true)}>
                    Mark Answered
                  </Button>
                )}
                <Button variant="outline" onClick={() => setSelectedRequest(null)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Prayer Note Dialog */}
      <Dialog open={showPrayerNote} onOpenChange={() => setShowPrayerNote(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark as Answered</DialogTitle>
            <DialogDescription>
              Add notes about how this prayer was answered.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Prayer Notes</Label>
              <Textarea
                value={prayerNote}
                onChange={e => setPrayerNote(e.target.value)}
                placeholder="How was this prayer answered? Any follow-up needed?"
                rows={4}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowPrayerNote(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveNote}>
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}