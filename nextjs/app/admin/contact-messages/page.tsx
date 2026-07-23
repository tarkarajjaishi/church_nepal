'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/admin/api'
import { Mail, Phone, Calendar, Eye, Trash2, MessageSquare } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { Loading, EmptyState } from '@/components/LoadingStates'

const typeColors: Record<string, string> = {
  contact: 'bg-blue-100 text-blue-800',
  prayer: 'bg-purple-100 text-purple-800',
  visit: 'bg-green-100 text-green-800',
  volunteer: 'bg-orange-100 text-orange-800',
}

const statusColors: Record<string, string> = {
  new: 'bg-gray-100 text-gray-800',
  read: 'bg-blue-100 text-blue-800',
  responded: 'bg-green-100 text-green-800',
}

export default function ContactMessagesPage() {
  const qc = useQueryClient()
  const [typeFilter, setTypeFilter] = useState('contact')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedMessage, setSelectedMessage] = useState<any>(null)

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['contact-messages', typeFilter],
    queryFn: () => {
      const params = new URLSearchParams()
      params.set('message_type', typeFilter)
      return api.get(`/contact-messages?${params.toString()}`).then(r => r.data)
    },
  })

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.put(`/contact-messages/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contact-messages'] })
      setSelectedMessage(null)
      toast.success('Message updated')
    },
  })

  const deleteMut = useMutation({
    mutationFn: (id: string) => api.delete(`/contact-messages/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contact-messages'] })
      setSelectedMessage(null)
      toast.success('Deleted')
    },
  })

  const markRead = (msg: any) => {
    updateMut.mutate({ id: msg.id, data: { status: 'read' } })
  }

  const filtered = messages.filter((m: any) =>
    !searchQuery ||
    m.message?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (m.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (m.email || '').toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleRespond = () => {
    if (!selectedMessage) return
    updateMut.mutate({
      id: selectedMessage.id,
      data: { status: 'responded' },
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#0b3c5d] flex items-center gap-2">
          <Mail className="size-6" />
          Contact Messages
        </h1>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{filtered.length} messages</span>
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <MessageSquare className="size-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filter:</span>
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="contact">Contact</SelectItem>
                <SelectItem value="prayer">Prayer</SelectItem>
                <SelectItem value="visit">Visit</SelectItem>
                <SelectItem value="volunteer">Volunteer</SelectItem>
              </SelectContent>
            </Select>
            <div className="relative">
              <Input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search messages..."
                className="w-64"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <Loading />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Mail className="size-10" />}
          title="No contact messages found"
          description="Contact submissions will appear here."
        />
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((msg: any) => (
            <Card key={msg.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedMessage(msg)}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className={`text-xs ${typeColors[msg.messageType] || typeColors.contact}`}>
                      {msg.messageType}
                    </Badge>
                    <Badge variant="secondary" className={`text-xs ${statusColors[msg.status] || statusColors.new}`}>
                      {msg.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1">
                    {msg.status !== 'read' && msg.status !== 'responded' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => { e.stopPropagation(); markRead(msg) }}
                        title="Mark as read"
                      >
                        <Eye className="size-3.5" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => { e.stopPropagation(); setSelectedMessage(msg) }}
                      title="View details"
                    >
                      <Eye className="size-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => { e.stopPropagation(); if (confirm('Delete this message?')) deleteMut.mutate(msg.id) }}
                      title="Delete"
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>

                <p className="text-sm text-foreground/80 line-clamp-3 mb-3">
                  &ldquo;{msg.message}&rdquo;
                </p>

                <div className="space-y-1 text-xs text-muted-foreground">
                  <div>From: {msg.name || 'Anonymous'}</div>
                  {msg.email && <div className="flex items-center gap-1"><Mail className="size-3" /> {msg.email}</div>}
                  {msg.phone && <div className="flex items-center gap-1"><Phone className="size-3" /> {msg.phone}</div>}
                  <div className="flex items-center gap-1">
                    <Calendar className="size-3" />
                    {new Date(msg.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!selectedMessage} onOpenChange={(open) => { if (!open) setSelectedMessage(null) }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Contact Message Details</DialogTitle>
            <DialogDescription>
              {selectedMessage && (
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className={`text-xs ${typeColors[selectedMessage.messageType] || typeColors.contact}`}>
                    {selectedMessage.messageType}
                  </Badge>
                  <Badge variant="secondary" className={`text-xs ${statusColors[selectedMessage.status] || statusColors.new}`}>
                    {selectedMessage.status}
                  </Badge>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          {selectedMessage && (
            <div className="space-y-4">
              <div>
                <Label>Message</Label>
                <p className="mt-1 p-3 bg-muted/50 rounded-lg text-sm whitespace-pre-wrap">&ldquo;{selectedMessage.message}&rdquo;</p>
              </div>
              {selectedMessage.name && (
                <div>
                  <Label>From</Label>
                  <p className="mt-1 text-sm">{selectedMessage.name}</p>
                </div>
              )}
              {selectedMessage.email && (
                <div>
                  <Label>Email</Label>
                  <p className="mt-1 text-sm">{selectedMessage.email}</p>
                </div>
              )}
              {selectedMessage.phone && (
                <div>
                  <Label>Phone</Label>
                  <p className="mt-1 text-sm">{selectedMessage.phone}</p>
                </div>
              )}
              {selectedMessage.category && (
                <div>
                  <Label>Category / Subject</Label>
                  <p className="mt-1 text-sm">{selectedMessage.category}</p>
                </div>
              )}
              <div className="flex justify-end gap-2 pt-2">
                {selectedMessage.status !== 'responded' && (
                  <Button onClick={handleRespond} disabled={updateMut.isPending}>
                    Mark Responded
                  </Button>
                )}
                <Button variant="outline" onClick={() => setSelectedMessage(null)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
