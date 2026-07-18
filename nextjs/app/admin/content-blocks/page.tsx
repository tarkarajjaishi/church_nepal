'use client'

import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { type ColumnDef } from '@tanstack/react-table'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import api, { uploadFile } from '@/lib/admin/api'
import { Plus, Pencil, Trash2, Upload, GripVertical, LayoutGrid } from 'lucide-react'
import { Badge, Switch, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, Button } from '@/components/admin/DataTable'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toast } from 'sonner'
import { RichTextEditor } from '@/components/admin/RichTextEditor'
import { ItemsEditor } from '@/components/admin/ItemsEditor'
import { MediaPicker } from '@/components/admin/MediaPicker'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search } from 'lucide-react'

interface ContentBlock {
  id: string
  sectionKey: string
  title: string
  subtitle: string | null
  body: string | null
  image: string | null
  icon: string | null
  items: any
  enabled: boolean | null
  sortOrder: number | null
}

const emptyForm = { section_key: '', title: '', subtitle: '', body: '', image: '', icon: '', eyebrow: '', cta_buttons: [] as { label: string; link: string }[], items: [] as Record<string, any>[] }

const sectionGroups = [
  { key: 'all', label: 'All Pages' },
  { key: 'home', label: 'Home', prefixes: ['hero', 'welcome', 'what_to_expect', 'what_we_believe', 'watch_online', 'prayer_cta', 'service_times_section', 'featured_sermons', 'ministries_section', 'events_section', 'notice_board', 'testimonies_section', 'gallery_section', 'verse_section', 'donation_section', 'newsletter', 'church_members', 'footer', 'site_brand', 'social_links'] },
  { key: 'about', label: 'About', prefixes: ['about_'] },
  { key: 'visit', label: 'Visit', prefixes: ['visit_'] },
  { key: 'pastor', label: 'Pastor', prefixes: ['pastor_'] },
  { key: 'leadership', label: 'Leadership', prefixes: ['leadership_'] },
  { key: 'groups', label: 'Groups', prefixes: ['groups_'] },
  { key: 'prayer', label: 'Prayer', prefixes: ['prayer_'] },
  { key: 'give', label: 'Give', prefixes: ['give_'] },
  { key: 'ministries', label: 'Ministries', prefixes: ['ministries_'] },
  { key: 'sermons', label: 'Sermons', prefixes: ['sermons_'] },
  { key: 'events', label: 'Events', prefixes: ['events_'] },
  { key: 'gallery', label: 'Gallery', prefixes: ['gallery_'] },
  { key: 'contact', label: 'Contact', prefixes: ['contact_'] },
  { key: 'live', label: 'Live', prefixes: ['live_'] },
  { key: 'privacy', label: 'Privacy', prefixes: ['privacy_'] },
  { key: 'terms', label: 'Terms', prefixes: ['terms_'] },
]

function getPageLabel(sectionKey: string): string {
  for (const group of sectionGroups) {
    if (group.prefixes?.some(p => sectionKey.startsWith(p))) {
      return group.label
    }
  }
  return 'Home'
}

function SortableRow({ row, children }: { row: any; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: row.original.id })
  const isEnabled = row.original.enabled ?? true

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : (isEnabled ? 1 : 0.5),
    position: 'relative' as const,
    zIndex: isDragging ? 50 : 'auto',
  }

  return (
    <TableRow ref={setNodeRef} style={style}>
      {children}
    </TableRow>
  )
}

function DragHandle({ id }: { id: string }) {
  const { attributes, listeners } = useSortable({ id })
  return (
    <button className="cursor-grab active:cursor-grabbing p-1 text-gray-400 hover:text-church-blue" {...attributes} {...listeners}>
      <GripVertical className="size-4" />
    </button>
  )
}

export default function ContentBlocksPage() {
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState<ContentBlock | null>(null)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState<Record<string, any>>(emptyForm)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [uploadingField, setUploadingField] = useState<string | null>(null)
  const [sectionFilter, setSectionFilter] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['content-blocks'],
    queryFn: () => api.get('/content-blocks').then(r => r.data),
  })

  const sortedItems = useMemo(() => {
    return [...items].sort((a: ContentBlock, b: ContentBlock) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
  }, [items])

  const filteredItems = useMemo(() => {
    let result = sortedItems
    if (sectionFilter !== 'all') {
      const group = sectionGroups.find(g => g.key === sectionFilter)
      if (group?.prefixes) {
        result = result.filter((item: ContentBlock) => group.prefixes.some(p => item.sectionKey.startsWith(p)))
      }
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      result = result.filter((item: ContentBlock) =>
        item.sectionKey.toLowerCase().includes(term) ||
        item.title.toLowerCase().includes(term) ||
        (item.subtitle && item.subtitle.toLowerCase().includes(term))
      )
    }
    return result
  }, [sortedItems, sectionFilter, searchTerm])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const createMut = useMutation({
    mutationFn: (data: any) => api.post('/content-blocks', data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['content-blocks'] }); setCreating(false); setForm(emptyForm); toast.success('Section created') },
    onError: () => toast.error('Failed to create section'),
  })

  const updateMut = useMutation({
    mutationFn: ({ id, data }: any) => api.put(`/content-blocks/${id}`, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['content-blocks'] }); setEditing(null); setForm(emptyForm); toast.success('Section updated') },
    onError: () => toast.error('Failed to update section'),
  })

  const deleteMut = useMutation({
    mutationFn: (id: string) => api.delete(`/content-blocks/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['content-blocks'] }); setConfirmDelete(null); toast.success('Section deleted') },
    onError: () => toast.error('Failed to delete section'),
  })

  const toggleMut = useMutation({
    mutationFn: (id: string) => api.put(`/content-blocks/${id}/toggle`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['content-blocks'] }); toast.success('Visibility toggled') },
  })

  const reorderMut = useMutation({
    mutationFn: (items: { id: string; sort_order: number }[]) => api.patch('/content-blocks/reorder', { items }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['content-blocks'] }),
  })

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = filteredItems.findIndex(item => item.id === active.id)
    const newIndex = filteredItems.findIndex(item => item.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    const reordered = arrayMove(filteredItems, oldIndex, newIndex)
    const items = reordered.map((item, index) => ({
      id: item.id,
      sort_order: (index + 1) * 10,
    }))
    reorderMut.mutate(items)
  }

  const handleUpload = async (fieldKey: string, file: File) => {
    setUploadingField(fieldKey)
    try {
      const result = await uploadFile(file)
      setForm(prev => ({ ...prev, [fieldKey]: result.url }))
    } catch (err: any) {
      toast.error(`Upload failed: ${err.message}`)
    } finally {
      setUploadingField(null)
    }
  }

  const getImageSrc = (url: string) => {
    if (!url) return ''
    if (url.startsWith('http')) return url
    return `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3002'}${url}`
  }

  const openCreate = () => { setForm(emptyForm); setCreating(true) }
  const openEdit = (item: ContentBlock) => {
    setEditing(item)
    const firstItem = Array.isArray(item.items) ? item.items[0] : (item.items || {})
    setForm({
      title: item.title,
      subtitle: item.subtitle || '',
      body: item.body || '',
      image: item.image || '',
      icon: item.icon || '',
      eyebrow: firstItem?.eyebrow || '',
      cta_buttons: firstItem?.ctaButtons || [],
      items: Array.isArray(item.items) ? item.items : (item.items ? [item.items] : []),
    })
  }

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.section_key || !form.title) return
    let itemsArr: Record<string, any>[] = [...(form.items || [])]
    if (itemsArr.length === 0) {
      const itemsObj: Record<string, any> = {}
      if (form.eyebrow) itemsObj.eyebrow = form.eyebrow
      if (form.cta_buttons?.length) itemsObj.ctaButtons = form.cta_buttons
      if (Object.keys(itemsObj).length > 0) itemsArr.push(itemsObj)
    } else {
      if (form.eyebrow) itemsArr[0] = { ...itemsArr[0], eyebrow: form.eyebrow }
      if (form.cta_buttons?.length) itemsArr[0] = { ...itemsArr[0], ctaButtons: form.cta_buttons }
    }
    createMut.mutate({
      section_key: form.section_key,
      title: form.title,
      subtitle: form.subtitle || '',
      body: form.body || '',
      image: form.image || '',
      icon: form.icon || '',
      items: itemsArr.length > 0 ? itemsArr : undefined,
    })
  }

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editing) return
    let itemsArr: Record<string, any>[] = [...(form.items || [])]
    if (itemsArr.length === 0) {
      const itemsObj: Record<string, any> = {}
      if (form.eyebrow) itemsObj.eyebrow = form.eyebrow
      if (form.cta_buttons?.length) itemsObj.ctaButtons = form.cta_buttons
      if (Object.keys(itemsObj).length > 0) itemsArr.push(itemsObj)
    } else {
      if (form.eyebrow) itemsArr[0] = { ...itemsArr[0], eyebrow: form.eyebrow }
      if (form.cta_buttons?.length) itemsArr[0] = { ...itemsArr[0], ctaButtons: form.cta_buttons }
    }
    updateMut.mutate({
      id: editing.id,
      data: { ...form, items: itemsArr.length > 0 ? itemsArr : undefined },
    })
  }

  const isModalOpen = creating || !!editing

  return (
    <div>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-2">
            <LayoutGrid className="size-5 text-church-blue" />
            <div>
              <CardTitle>Content Sections</CardTitle>
              <CardDescription>Edit, create, toggle visibility, and reorder sections across the website. Drag rows to reorder.</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Select value={sectionFilter} onValueChange={setSectionFilter}>
              <SelectTrigger className="w-[180px] h-8 text-sm">
                <SelectValue placeholder="Filter by page" />
              </SelectTrigger>
              <SelectContent>
                {sectionGroups.map(g => (
                  <SelectItem key={g.key} value={g.key}>{g.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="relative max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
              <Input
                placeholder="Search sections..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-8 text-sm"
              />
            </div>
            <Button onClick={openCreate} className="bg-church-blue hover:bg-church-blue/90">
              <Plus className="mr-1 size-4" /> New Section
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="p-8 text-center text-gray-500">
                <div className="animate-pulse space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-1/4 mx-auto" />
                  <div className="h-4 bg-gray-200 rounded w-1/3 mx-auto" />
                  <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto" />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                {filteredItems.length} of {items.length} sections
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]"></TableHead>
                      <TableHead className="w-[180px]">Status</TableHead>
                      <TableHead className="w-[120px]">Page</TableHead>
                      <TableHead>Section Key</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Subtitle</TableHead>
                      <TableHead className="w-[60px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={filteredItems.map(i => i.id)} strategy={verticalListSortingStrategy}>
                      <TableBody>
                        {filteredItems.length > 0 ? (
                          filteredItems.map((item: ContentBlock, idx: number) => (
                            <SortableRow key={item.id} row={{ original: item }}>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <DragHandle id={item.id} />
                                  <span className="text-xs font-mono text-gray-500">{item.sortOrder ?? idx}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Switch
                                    checked={item.enabled ?? true}
                                    onCheckedChange={() => toggleMut.mutate(item.id)}
                                    disabled={toggleMut.isPending}
                                  />
                                  <Badge variant={item.enabled ? 'default' : 'secondary'}>
                                    {item.enabled ? 'Visible' : 'Hidden'}
                                  </Badge>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="text-xs">{getPageLabel(item.sectionKey)}</Badge>
                              </TableCell>
                              <TableCell>
                                <span className="font-mono text-xs text-gray-500">{item.sectionKey}</span>
                              </TableCell>
                              <TableCell>
                                <span className="font-medium">{item.title}</span>
                              </TableCell>
                              <TableCell>
                                <span className="text-muted-foreground max-w-[300px] truncate block">{item.subtitle || '\u2014'}</span>
                              </TableCell>
                              <TableCell>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="size-8 p-0">
                                      <span className="sr-only">Actions</span>
                                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-4"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => openEdit(item)}>
                                      <Pencil className="mr-2 size-4" /> Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setConfirmDelete(item.id)} className="text-destructive">
                                      <Trash2 className="mr-2 size-4" /> Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </SortableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                              No sections found.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </SortableContext>
                  </DndContext>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create / Edit Dialog */}
      <Dialog open={isModalOpen} onOpenChange={(open) => { if (!open) { setCreating(false); setEditing(null); setForm(emptyForm) } }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{creating ? 'Create New Section' : `Edit: ${editing?.sectionKey}`}</DialogTitle>
            <DialogDescription>{creating ? 'Add a new content section to the homepage.' : 'Update the content for this section.'}</DialogDescription>
          </DialogHeader>
          <form onSubmit={creating ? handleCreate : handleUpdate} className="space-y-4">
            {creating && (
              <div className="space-y-2">
                <Label>Section Key *</Label>
                <Input value={form.section_key ?? ''} onChange={e => setForm({ ...form, section_key: e.target.value })} placeholder="e.g. my_custom_section" required />
                <p className="text-xs text-muted-foreground">Unique identifier. Use lowercase with underscores.</p>
              </div>
            )}
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input value={form.title ?? ''} onChange={e => setForm({ ...form, title: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>Subtitle</Label>
              <Textarea value={form.subtitle ?? ''} onChange={e => setForm({ ...form, subtitle: e.target.value })} rows={2} />
            </div>
            <div className="space-y-2">
              <Label>Body Content</Label>
              <RichTextEditor value={form.body || ''} onChange={val => setForm({ ...form, body: val })} />
            </div>
            <div className="space-y-2">
              <Label>Image</Label>
              {form.image && (
                <div className="relative inline-block mb-2">
                  <img src={getImageSrc(form.image)} alt="Preview" className="h-24 rounded-lg object-cover border" />
                  <button type="button" onClick={() => setForm(prev => ({ ...prev, image: '' }))} className="absolute -top-2 -right-2 size-5 bg-destructive text-white rounded-full flex items-center justify-center text-xs">x</button>
                </div>
              )}
              <div className="flex gap-2">
                <input type="file" accept="image/*" className="hidden" id="cb-image-upload" onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload('image', f); e.target.value = '' }} />
                <Button type="button" variant="outline" size="sm" onClick={() => document.getElementById('cb-image-upload')?.click()} disabled={uploadingField === 'image'}>
                  {uploadingField === 'image' ? <span className="animate-spin size-4 border-2 border-gray-300 border-t-church-blue rounded-full mr-1" /> : <Upload className="size-4 mr-1" />}
                  {uploadingField === 'image' ? 'Uploading...' : 'Upload Image'}
                </Button>
                <MediaPicker value={form.image ?? ''} onSelect={(url) => setForm(prev => ({ ...prev, image: url }))} />
                <Input value={form.image ?? ''} onChange={e => setForm({ ...form, image: e.target.value })} placeholder="Or paste URL" className="flex-1" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Icon (lucide-react name)</Label>
              <Input value={form.icon ?? ''} onChange={e => setForm({ ...form, icon: e.target.value })} placeholder="e.g. Sparkles, Heart, BookOpen" />
            </div>
            <div className="space-y-2">
              <Label>Eyebrow Text</Label>
              <Input value={form.eyebrow ?? ''} onChange={e => setForm({ ...form, eyebrow: e.target.value })} placeholder="Small tag above the headline" />
              <p className="text-xs text-muted-foreground">Optional small text badge above the main title</p>
            </div>
            <div className="space-y-2">
              <Label>CTA Buttons</Label>
              <p className="text-xs text-muted-foreground">Action buttons. Leave empty for defaults.</p>
              {(form.cta_buttons || []).map((btn: { label: string; link: string }, idx: number) => (
                <div key={idx} className="flex gap-2">
                  <Input value={btn.label ?? ''} onChange={e => {
                    const newBtns = [...(form.cta_buttons || [])]
                    newBtns[idx] = { ...newBtns[idx], label: e.target.value }
                    setForm({ ...form, cta_buttons: newBtns })
                  }} placeholder="Button label" className="flex-1" />
                  <Input value={btn.link ?? ''} onChange={e => {
                    const newBtns = [...(form.cta_buttons || [])]
                    newBtns[idx] = { ...newBtns[idx], link: e.target.value }
                    setForm({ ...form, cta_buttons: newBtns })
                  }} placeholder="Link (e.g. /sermons)" className="flex-1" />
                  <Button type="button" variant="ghost" size="sm" onClick={() => setForm({ ...form, cta_buttons: (form.cta_buttons || []).filter((_: any, i: number) => i !== idx) })} className="text-destructive hover:text-destructive">
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={() => setForm({ ...form, cta_buttons: [...(form.cta_buttons || []), { label: '', link: '/' }] })}>
                <Plus className="size-3.5 mr-1" /> Add Button
              </Button>
            </div>
            <div className="space-y-2">
              <Label>Items (Nested Data)</Label>
              <p className="text-xs text-muted-foreground">Add, remove, reorder, or edit fields for each item. Field keys are inferred from existing items.</p>
              <ItemsEditor
                items={form.items || []}
                onChange={(newItems) => setForm({ ...form, items: newItems })}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setCreating(false); setEditing(null); setForm(emptyForm) }}>Cancel</Button>
              <Button type="submit" disabled={createMut.isPending || updateMut.isPending} className="bg-church-blue hover:bg-church-blue/90">
                {createMut.isPending || updateMut.isPending ? 'Saving...' : creating ? 'Create Section' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!confirmDelete} onOpenChange={(open) => { if (!open) setConfirmDelete(null) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete this section?</DialogTitle>
            <DialogDescription>This will permanently remove it from the homepage.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deleteMut.mutate(confirmDelete!)} disabled={deleteMut.isPending}>
              {deleteMut.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
