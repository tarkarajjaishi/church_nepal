'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/admin/api'
import { Plus, Pencil, Trash2, Users, Home, Tag, StickyNote, ChevronUp, ChevronDown, Search, UserPlus, X } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

const statusColors: Record<string, string> = {
  visitor: 'bg-yellow-100 text-yellow-800',
  regular: 'bg-blue-100 text-blue-800',
  member: 'bg-green-100 text-green-800',
  inactive: 'bg-gray-100 text-gray-800',
}

export default function PeoplePage() {
  const qc = useQueryClient()
  const [tab, setTab] = useState<'people' | 'households' | 'tags'>('people')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState<Record<string, any>>({})
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [selectedPerson, setSelectedPerson] = useState<any>(null)
  const [showNotes, setShowNotes] = useState(false)
  const [noteText, setNoteText] = useState('')
  const [showTagManager, setShowTagManager] = useState(false)
  const [newTagName, setNewTagName] = useState('')
  const [newTagColor, setNewTagColor] = useState('#3B82F6')
  const [showHouseholdForm, setShowHouseholdForm] = useState(false)
  const [householdForm, setHouseholdForm] = useState<Record<string, any>>({})
  const [editingHousehold, setEditingHousehold] = useState<any>(null)

  // Queries
  const { data: people = [], isLoading } = useQuery({
    queryKey: ['people', statusFilter, search],
    queryFn: () => {
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.set('status', statusFilter)
      if (search) params.set('search', search)
      return api.get(`/people?${params}`).then(r => r.data)
    },
  })

  const { data: households = [] } = useQuery({
    queryKey: ['households'],
    queryFn: () => api.get('/households').then(r => r.data),
  })

  const { data: tags = [] } = useQuery({
    queryKey: ['tags'],
    queryFn: () => api.get('/tags').then(r => r.data),
  })

  const { data: personTags = [] } = useQuery({
    queryKey: ['person-tags', selectedPerson?.id],
    queryFn: () => api.get(`/people/${selectedPerson.id}/tags`).then(r => r.data),
    enabled: !!selectedPerson,
  })

  const { data: personNotes = [] } = useQuery({
    queryKey: ['person-notes', selectedPerson?.id],
    queryFn: () => api.get(`/people/${selectedPerson.id}/notes`).then(r => r.data),
    enabled: !!selectedPerson && showNotes,
  })

  const { data: stats } = useQuery({
    queryKey: ['people-stats'],
    queryFn: () => api.get('/people/stats').then(r => r.data),
  })

  // Mutations
  const createMut = useMutation({
    mutationFn: (data: any) => api.post('/people', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['people'] }); qc.invalidateQueries({ queryKey: ['people-stats'] }); setShowForm(false); setForm({}); toast.success('Person created') },
    onError: () => toast.error('Failed to create person'),
  })

  const updateMut = useMutation({
    mutationFn: ({ id, data }: any) => api.put(`/people/${id}`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['people'] }); setShowForm(false); setEditing(null); setForm({}); toast.success('Person updated') },
    onError: () => toast.error('Failed to update person'),
  })

  const deleteMut = useMutation({
    mutationFn: (id: string) => api.delete(`/people/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['people'] }); qc.invalidateQueries({ queryKey: ['people-stats'] }); setConfirmDelete(null); toast.success('Deleted') },
  })

  const toggleMut = useMutation({
    mutationFn: (id: string) => api.put(`/people/${id}/toggle`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['people'] }); toast.success('Toggled') },
  })

  const createNoteMut = useMutation({
    mutationFn: ({ personId, note }: { personId: string; note: string }) => api.post(`/people/${personId}/notes`, { note }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['person-notes'] }); setNoteText(''); toast.success('Note added') },
  })

  const deleteNoteMut = useMutation({
    mutationFn: ({ personId, noteId }: { personId: string; noteId: string }) => api.delete(`/people/${personId}/notes/${noteId}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['person-notes'] }); toast.success('Note deleted') },
  })

  const addTagMut = useMutation({
    mutationFn: (data: any) => api.post('/tags', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tags'] }); setNewTagName(''); toast.success('Tag created') },
  })

  const deleteTagMut = useMutation({
    mutationFn: (id: string) => api.delete(`/tags/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tags'] }); toast.success('Tag deleted') },
  })

  const addPersonTagMut = useMutation({
    mutationFn: ({ personId, tagId }: { personId: string; tagId: string }) => api.post(`/people/${personId}/tags/${tagId}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['person-tags'] }); toast.success('Tag added') },
  })

  const removePersonTagMut = useMutation({
    mutationFn: ({ personId, tagId }: { personId: string; tagId: string }) => api.delete(`/people/${personId}/tags/${tagId}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['person-tags'] }); toast.success('Tag removed') },
  })

  const createHouseholdMut = useMutation({
    mutationFn: (data: any) => api.post('/households', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['households'] }); setShowHouseholdForm(false); setHouseholdForm({}); toast.success('Household created') },
  })

  const updateHouseholdMut = useMutation({
    mutationFn: ({ id, data }: any) => api.put(`/households/${id}`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['households'] }); setShowHouseholdForm(false); setEditingHousehold(null); setHouseholdForm({}); toast.success('Household updated') },
  })

  const deleteHouseholdMut = useMutation({
    mutationFn: (id: string) => api.delete(`/households/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['households'] }); toast.success('Household deleted') },
  })

  const openCreate = () => { setEditing(null); setForm({ memberStatus: 'visitor' }); setShowForm(true) }
  const openEdit = (p: any) => { setEditing(p); setForm({ ...p, joinedDate: p.joinedDate ? p.joinedDate.split('T')[0] : '' }); setShowForm(true) }
  const openPersonDetail = (p: any) => { setSelectedPerson(p); setShowNotes(false) }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editing) updateMut.mutate({ id: editing.id, data: form })
    else createMut.mutate(form)
  }

  const handleSubmitHousehold = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingHousehold) updateHouseholdMut.mutate({ id: editingHousehold.id, data: householdForm })
    else createHouseholdMut.mutate(householdForm)
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        {[
          { label: 'Total People', value: stats?.total ?? 0, icon: Users, color: 'text-church-blue' },
          { label: 'Visitors', value: stats?.visitors ?? 0, icon: UserPlus, color: 'text-yellow-600' },
          { label: 'Regular', value: stats?.regular ?? 0, icon: Users, color: 'text-blue-600' },
          { label: 'Members', value: stats?.members ?? 0, icon: Users, color: 'text-green-600' },
          { label: 'Inactive', value: stats?.inactive ?? 0, icon: Users, color: 'text-gray-600' },
          { label: 'Households', value: stats?.households ?? 0, icon: Home, color: 'text-purple-600' },
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

      {/* Tabs */}
      <div className="flex gap-2 border-b pb-2">
        {[
          { key: 'people' as const, label: 'People', icon: Users },
          { key: 'households' as const, label: 'Households', icon: Home },
          { key: 'tags' as const, label: 'Tags', icon: Tag },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${
              tab === t.key ? 'bg-church-blue text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}>
            <t.icon className="size-4" /> {t.label}
          </button>
        ))}
      </div>

      {/* People Tab */}
      {tab === 'people' && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>People Directory</CardTitle>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search people..." className="pl-9 w-64" />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="visitor">Visitor</SelectItem>
                  <SelectItem value="regular">Regular</SelectItem>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
              <button onClick={openCreate} className="flex items-center gap-1 px-4 py-2 bg-church-blue text-white rounded-lg text-sm hover:bg-church-blue/90">
                <Plus className="size-4" /> Add Person
              </button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="p-2">Name</th>
                    <th className="p-2">Email</th>
                    <th className="p-2">Phone</th>
                    <th className="p-2">Status</th>
                    <th className="p-2">Household</th>
                    <th className="p-2">Joined</th>
                    <th className="p-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">Loading...</td></tr>
                  ) : people.length === 0 ? (
                    <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">No people found</td></tr>
                  ) : people.map((p: any) => {
                    const hh = households.find((h: any) => h.id === p.householdId)
                    return (
                      <tr key={p.id} className="border-b hover:bg-muted/50 cursor-pointer" onClick={() => openPersonDetail(p)}>
                        <td className="p-2 font-medium">{p.firstName} {p.lastName}</td>
                        <td className="p-2 text-muted-foreground">{p.email || '-'}</td>
                        <td className="p-2 text-muted-foreground">{p.phone || '-'}</td>
                        <td className="p-2">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[p.memberStatus] || 'bg-gray-100'}`}>
                            {p.memberStatus}
                          </span>
                        </td>
                        <td className="p-2 text-muted-foreground">{hh?.name || '-'}</td>
                        <td className="p-2 text-muted-foreground">{p.joinedDate || '-'}</td>
                        <td className="p-2 text-right" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => openEdit(p)} className="p-1 hover:bg-muted rounded"><Pencil className="size-3.5" /></button>
                            <button onClick={() => setConfirmDelete(p.id)} className="p-1 hover:bg-destructive/10 text-destructive rounded"><Trash2 className="size-3.5" /></button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Households Tab */}
      {tab === 'households' && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Households</CardTitle>
            <button onClick={() => { setEditingHousehold(null); setHouseholdForm({}); setShowHouseholdForm(true) }}
              className="flex items-center gap-1 px-4 py-2 bg-church-blue text-white rounded-lg text-sm hover:bg-church-blue/90">
              <Plus className="size-4" /> Add Household
            </button>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {households.map((h: any) => {
                const members = people.filter((p: any) => p.householdId === h.id)
                return (
                  <Card key={h.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold">{h.name}</h3>
                          {h.address && <p className="text-sm text-muted-foreground mt-1">{h.address}</p>}
                          {h.phone && <p className="text-sm text-muted-foreground">{h.phone}</p>}
                        </div>
                        <div className="flex gap-1">
                          <button onClick={() => { setEditingHousehold(h); setHouseholdForm(h); setShowHouseholdForm(true) }} className="p-1 hover:bg-muted rounded"><Pencil className="size-3.5" /></button>
                          <button onClick={() => deleteHouseholdMut.mutate(h.id)} className="p-1 hover:bg-destructive/10 text-destructive rounded"><Trash2 className="size-3.5" /></button>
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-1">
                        {members.map((m: any) => (
                          <Badge key={m.id} variant="secondary" className="text-xs">{m.firstName} {m.lastName}</Badge>
                        ))}
                        {members.length === 0 && <span className="text-xs text-muted-foreground">No members</span>}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
              {households.length === 0 && <p className="text-muted-foreground col-span-3 text-center py-8">No households yet</p>}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tags Tab */}
      {tab === 'tags' && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Tags</CardTitle>
            <div className="flex gap-2">
              <Input value={newTagName} onChange={e => setNewTagName(e.target.value)} placeholder="Tag name" className="w-48" />
              <input type="color" value={newTagColor} onChange={e => setNewTagColor(e.target.value)} className="size-9 rounded cursor-pointer" />
              <button onClick={() => { if (newTagName.trim()) addTagMut.mutate({ name: newTagName.trim(), color: newTagColor }) }}
                className="flex items-center gap-1 px-4 py-2 bg-church-blue text-white rounded-lg text-sm hover:bg-church-blue/90">
                <Plus className="size-4" /> Add
              </button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {tags.map((t: any) => (
                <div key={t.id} className="flex items-center gap-2 px-3 py-2 rounded-lg border" style={{ borderColor: t.color + '40' }}>
                  <div className="size-3 rounded-full" style={{ backgroundColor: t.color }} />
                  <span className="text-sm font-medium">{t.name}</span>
                  <button onClick={() => deleteTagMut.mutate(t.id)} className="text-muted-foreground hover:text-destructive"><X className="size-3.5" /></button>
                </div>
              ))}
              {tags.length === 0 && <p className="text-muted-foreground">No tags yet</p>}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Person Detail Sidebar / Dialog */}
      <Dialog open={!!selectedPerson} onOpenChange={(open) => { if (!open) setSelectedPerson(null) }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedPerson && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedPerson.firstName} {selectedPerson.lastName}</DialogTitle>
                <DialogDescription>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[selectedPerson.memberStatus]}`}>
                    {selectedPerson.memberStatus}
                  </span>
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                {/* Contact Info */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {selectedPerson.email && <div><span className="text-muted-foreground">Email:</span> {selectedPerson.email}</div>}
                  {selectedPerson.phone && <div><span className="text-muted-foreground">Phone:</span> {selectedPerson.phone}</div>}
                  {selectedPerson.address && <div className="col-span-2"><span className="text-muted-foreground">Address:</span> {selectedPerson.address}</div>}
                  {selectedPerson.city && <div><span className="text-muted-foreground">City:</span> {selectedPerson.city}</div>}
                  {selectedPerson.joinedDate && <div><span className="text-muted-foreground">Joined:</span> {selectedPerson.joinedDate}</div>}
                </div>

                {/* Tags */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-semibold flex items-center gap-1"><Tag className="size-3.5" /> Tags</h4>
                    <button onClick={() => setShowTagManager(!showTagManager)} className="text-xs text-church-blue hover:underline">
                      {showTagManager ? 'Done' : 'Manage'}
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {personTags.map((t: any) => (
                      <Badge key={t.id} variant="secondary" className="text-xs gap-1" style={{ backgroundColor: t.color + '20', color: t.color }}>
                        {t.name}
                        {showTagManager && (
                          <button onClick={() => removePersonTagMut.mutate({ personId: selectedPerson.id, tagId: t.id })} className="hover:text-destructive">
                            <X className="size-3" />
                          </button>
                        )}
                      </Badge>
                    ))}
                    {personTags.length === 0 && <span className="text-xs text-muted-foreground">No tags</span>}
                  </div>
                  {showTagManager && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {tags.filter((t: any) => !personTags.find((pt: any) => pt.id === t.id)).map((t: any) => (
                        <button key={t.id} onClick={() => addPersonTagMut.mutate({ personId: selectedPerson.id, tagId: t.id })}
                          className="text-xs px-2 py-1 rounded border border-dashed hover:bg-muted transition-colors" style={{ borderColor: t.color + '60' }}>
                          + {t.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Notes / Timeline */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-semibold flex items-center gap-1"><StickyNote className="size-3.5" /> Notes & Timeline</h4>
                    <button onClick={() => setShowNotes(!showNotes)} className="text-xs text-church-blue hover:underline">
                      {showNotes ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  {showNotes && (
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <Input value={noteText} onChange={e => setNoteText(e.target.value)} placeholder="Add a note..." className="flex-1" />
                        <button onClick={() => { if (noteText.trim()) createNoteMut.mutate({ personId: selectedPerson.id, note: noteText.trim() }) }}
                          disabled={!noteText.trim()} className="px-3 py-2 bg-church-blue text-white rounded-lg text-sm hover:bg-church-blue/90 disabled:opacity-50">
                          Add
                        </button>
                      </div>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {personNotes.map((n: any) => (
                          <div key={n.id} className="p-3 bg-muted/50 rounded-lg text-sm">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-muted-foreground text-xs">{n.author} - {new Date(n.createdAt).toLocaleDateString()}</span>
                              <button onClick={() => deleteNoteMut.mutate({ personId: selectedPerson.id, noteId: n.id })} className="text-muted-foreground hover:text-destructive">
                                <Trash2 className="size-3" />
                              </button>
                            </div>
                            <p>{n.note}</p>
                          </div>
                        ))}
                        {personNotes.length === 0 && <p className="text-xs text-muted-foreground">No notes yet</p>}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setSelectedPerson(null)}>Close</Button>
                <Button onClick={() => { setSelectedPerson(null); openEdit(selectedPerson) }} className="bg-church-blue hover:bg-church-blue/90">
                  <Pencil className="size-4 mr-1" /> Edit
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Create/Edit Person Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit' : 'Add'} Person</DialogTitle>
            <DialogDescription>{editing ? 'Update person details.' : 'Add a new person to the directory.'}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>First Name *</Label>
                <Input value={form.firstName ?? ''} onChange={e => setForm({ ...form, firstName: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Last Name</Label>
                <Input value={form.lastName ?? ''} onChange={e => setForm({ ...form, lastName: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={form.email ?? ''} onChange={e => setForm({ ...form, email: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input value={form.phone ?? ''} onChange={e => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div className="space-y-2 col-span-2">
                <Label>Address</Label>
                <Input value={form.address ?? ''} onChange={e => setForm({ ...form, address: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>City</Label>
                <Input value={form.city ?? ''} onChange={e => setForm({ ...form, city: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={form.memberStatus ?? 'visitor'} onValueChange={val => setForm({ ...form, memberStatus: val })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="visitor">Visitor</SelectItem>
                    <SelectItem value="regular">Regular</SelectItem>
                    <SelectItem value="member">Member</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Household</Label>
                <Select value={form.householdId ?? 'none'} onValueChange={val => setForm({ ...form, householdId: val === 'none' ? null : val })}>
                  <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {households.map((h: any) => <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Joined Date</Label>
                <Input type="date" value={form.joinedDate ?? ''} onChange={e => setForm({ ...form, joinedDate: e.target.value })} />
              </div>
              <div className="space-y-2 col-span-2">
                <Label>Notes</Label>
                <Input value={form.notes ?? ''} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Internal notes about this person" />
              </div>
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

      {/* Household Form Dialog */}
      <Dialog open={showHouseholdForm} onOpenChange={setShowHouseholdForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingHousehold ? 'Edit' : 'Add'} Household</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitHousehold} className="space-y-4">
            <div className="space-y-2">
              <Label>Household Name *</Label>
              <Input value={householdForm.name ?? ''} onChange={e => setHouseholdForm({ ...householdForm, name: e.target.value })} required placeholder="e.g. Sharma Family" />
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Input value={householdForm.address ?? ''} onChange={e => setHouseholdForm({ ...householdForm, address: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input value={householdForm.phone ?? ''} onChange={e => setHouseholdForm({ ...householdForm, phone: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Input value={householdForm.notes ?? ''} onChange={e => setHouseholdForm({ ...householdForm, notes: e.target.value })} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowHouseholdForm(false)}>Cancel</Button>
              <Button type="submit" disabled={createHouseholdMut.isPending || updateHouseholdMut.isPending} className="bg-church-blue hover:bg-church-blue/90">
                Save
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!confirmDelete} onOpenChange={(open) => { if (!open) setConfirmDelete(null) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete person?</DialogTitle>
            <DialogDescription>This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => confirmDelete && deleteMut.mutate(confirmDelete)} disabled={deleteMut.isPending}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
