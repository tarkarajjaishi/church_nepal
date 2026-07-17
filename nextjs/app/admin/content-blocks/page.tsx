'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { type ColumnDef } from '@tanstack/react-table'
import api, { uploadFile } from '@/lib/admin/api'
import { Plus, Pencil, Trash2, Upload, ChevronUp, ChevronDown, LayoutGrid } from 'lucide-react'
import { DataTable, Badge, Switch, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, Button } from '@/components/admin/DataTable'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { RichTextEditor } from '@/components/admin/RichTextEditor'
import { ItemsEditor } from '@/components/admin/ItemsEditor'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

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

export default function ContentBlocksPage() {
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState<ContentBlock | null>(null)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState<Record<string, any>>(emptyForm)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [uploadingField, setUploadingField] = useState<string | null>(null)
  const [sectionFilter, setSectionFilter] = useState<string>('all')

  const sectionGroups = [
    { key: 'all', label: 'All Sections' },
    { key: 'homepage', label: 'Homepage', prefixes: ['hero', 'welcome', 'what_to_expect', 'testimonies_heading', 'events_heading', 'sermons_heading', 'gallery_heading', 'cta_heading'] },
    { key: 'ministries', label: 'Ministries Page', prefixes: ['ministries_'] },
    { key: 'sermons', label: 'Sermons Page', prefixes: ['sermons_hero', 'sermons_heading', 'sermons_description', 'sermons_recent_heading', 'sermons_empty_state'] },
    { key: 'events', label: 'Events Page', prefixes: ['events_'] },
  ]

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['content-blocks'],
    queryFn: () => api.get('/content-blocks').then(r => r.data),
  })

  const filteredItems = items.filter((item: ContentBlock) => {
    if (sectionFilter === 'all') return true
    const group = sectionGroups.find(g => g.key === sectionFilter)
    if (!group || !group.prefixes) return true
    return group.prefixes.some(p => item.sectionKey.startsWith(p))
  })

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
    mutationFn: ({ id, sortOrder }: { id: string; sortOrder: number }) => api.put(`/content-blocks/${id}/reorder`, { sort_order: sortOrder }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['content-blocks'] }),
  })

  const moveItem = (index: number, direction: 'up' | 'down') => {
    const item = items[index]
    const swapIndex = direction === 'up' ? index - 1 : index + 1
    if (swapIndex < 0 || swapIndex >= items.length) return
    const swapItem = items[swapIndex]
    reorderMut.mutate({ id: item.id, sortOrder: swapItem.sortOrder ?? swapIndex })
    reorderMut.mutate({ id: swapItem.id, sortOrder: item.sortOrder ?? index })
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
    return `http://localhost:3002${url}`
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
    // Build items from form: merge eyebrow/cta_buttons into items[0] or use the items editor data
    let itemsArr: Record<string, any>[] = [...(form.items || [])]
    if (itemsArr.length === 0) {
      const itemsObj: Record<string, any> = {}
      if (form.eyebrow) itemsObj.eyebrow = form.eyebrow
      if (form.cta_buttons?.length) itemsObj.ctaButtons = form.cta_buttons
      if (Object.keys(itemsObj).length > 0) itemsArr.push(itemsObj)
    } else {
      // Merge eyebrow/cta_buttons into the first item
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

  const columns: ColumnDef<ContentBlock, any>[] = [
    {
      id: 'order',
      header: '#',
      cell: ({ row }) => {
        const idx = row.index
        return (
          <div className="flex flex-col items-center gap-0.5">
            <button onClick={() => moveItem(idx, 'up')} disabled={idx === 0} className="p-0.5 text-gray-400 hover:text-church-blue disabled:opacity-30"><ChevronUp className="size-3.5" /></button>
            <span className="text-xs font-mono text-gray-500">{row.original.sortOrder ?? idx}</span>
            <button onClick={() => moveItem(idx, 'down')} disabled={idx === items.length - 1} className="p-0.5 text-gray-400 hover:text-church-blue disabled:opacity-30"><ChevronDown className="size-3.5" /></button>
          </div>
        )
      },
      size: 60,
    },
    {
      id: 'enabled',
      header: 'Status',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Switch
            checked={row.original.enabled ?? true}
            onCheckedChange={() => toggleMut.mutate(row.original.id)}
            disabled={toggleMut.isPending}
          />
          <Badge variant={row.original.enabled ? 'default' : 'secondary'}>
            {row.original.enabled ? 'Visible' : 'Hidden'}
          </Badge>
        </div>
      ),
      size: 140,
    },
    {
      accessorKey: 'sectionKey',
      header: 'Section Key',
      cell: ({ row }) => <span className="font-mono text-xs text-gray-500">{row.original.sectionKey}</span>,
    },
    {
      accessorKey: 'title',
      header: 'Title',
      cell: ({ row }) => <span className="font-medium">{row.original.title}</span>,
    },
    {
      accessorKey: 'subtitle',
      header: 'Subtitle',
      cell: ({ row }) => <span className="text-muted-foreground max-w-[300px] truncate block">{row.original.subtitle || '—'}</span>,
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="size-8 p-0">
              <span className="sr-only">Actions</span>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-4"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => openEdit(row.original)}>
              <Pencil className="mr-2 size-4" /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setConfirmDelete(row.original.id)} className="text-destructive">
              <Trash2 className="mr-2 size-4" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
      size: 60,
    },
  ]

  const isModalOpen = creating || !!editing

  return (
    <div>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-2">
            <LayoutGrid className="size-5 text-church-blue" />
            <div>
              <CardTitle>Content Sections</CardTitle>
              <CardDescription>Edit, create, toggle visibility, and reorder sections across the website.</CardDescription>
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
            <Button onClick={openCreate} className="bg-church-blue hover:bg-church-blue/90">
              <Plus className="mr-1 size-4" /> New Section
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            data={filteredItems}
            columns={columns}
            searchKey="title"
            searchPlaceholder="Search sections..."
            isLoading={isLoading}
          />
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
