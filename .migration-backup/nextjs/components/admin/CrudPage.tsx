'use client'

import { useState, useRef, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { type ColumnDef } from '@tanstack/react-table'
import { uploadFile } from '@/lib/admin/api'
import { Plus, Pencil, Trash2, Upload, ChevronUp, ChevronDown, Pin } from 'lucide-react'
import { DataTable, Badge, Switch, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, Button } from '@/components/admin/DataTable'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { RichTextEditor } from './RichTextEditor'
import { useSettingsSections, useToggleSection } from '@/lib/hooks/settings'
import { createResourceHooks } from '@/lib/hooks/factory'

interface Field {
  key: string
  label: string
  type: 'text' | 'textarea' | 'number' | 'checkbox' | 'select'
  options?: string[]
}

export function CrudPage({ endpoint, title, fields, enablePin = false }: { endpoint: string; title: string; fields: Field[]; enablePin?: boolean }) {
  const queryClient = useQueryClient()
  const { useList, useCreate, useUpdate, useDelete, useToggle, useReorder, usePin } = createResourceHooks<any>(endpoint)
  const { data: items = [], isLoading } = useList()
  const createMut = useCreate()
  const updateMut = useUpdate()
  const deleteMut = useDelete()
  const toggleMut = useToggle()
  const reorderMut = useReorder()
  const pinMut = usePin()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState<Record<string, any>>({})
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [uploadingField, setUploadingField] = useState<string | null>(null)
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({})

  const sectionApiKey = endpoint.replace(/-/g, '_')
  const sectionKey = endpoint.replace(/-([a-z])/g, (_, c) => c.toUpperCase())
  const { data: sections = {} } = useSettingsSections()
  const { toggleSection, isPending: sectionToggling } = useToggleSection()
  const sectionEnabled = (sections as Record<string, boolean>)[sectionKey] === true

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

  const isImageField = (key: string) => key === 'image' || key === 'thumbnail' || key === 'banner'

  const getImageSrc = (url: string) => {
    if (!url) return ''
    if (url.startsWith('http')) return url
    return `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3002'}${url}`
  }

  const openCreate = () => { setEditing(null); setForm({ sortOrder: items.length }); setShowForm(true) }
  const openEdit = (item: any) => { setEditing(item); setForm(item); setShowForm(true) }

  // Deep link: /admin/<resource>?edit=<id> opens that exact item's editor once.
  // This is what the "Edit" pens on the public homepage link to.
  const searchParams = useSearchParams()
  const handledEditRef = useRef(false)
  useEffect(() => {
    if (handledEditRef.current) return
    const editId = searchParams.get('edit')
    if (!editId || !items.length) return
    const item = items.find((x: any) => String(x.id) === editId)
    if (item) {
      openEdit(item)
      handledEditRef.current = true
    }
  }, [searchParams, items])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editing) {
      updateMut.mutate({ id: editing.id, data: form })
    } else {
      createMut.mutate(form)
    }
  }

  const columns: ColumnDef<any, any>[] = [
    {
      id: 'order',
      header: '#',
      cell: ({ row }) => {
        const idx = row.index
        return (
          <div className="flex flex-col items-center gap-0.5">
            <button onClick={() => moveItem(idx, 'up')} disabled={idx === 0 || reorderMut.isPending} className="p-0.5 text-gray-400 hover:text-church-blue disabled:opacity-30"><ChevronUp className="size-3.5" /></button>
            <span className="text-xs font-mono text-gray-500">{row.original.sortOrder ?? idx}</span>
            <button onClick={() => moveItem(idx, 'down')} disabled={idx === items.length - 1 || reorderMut.isPending} className="p-0.5 text-gray-400 hover:text-church-blue disabled:opacity-30"><ChevronDown className="size-3.5" /></button>
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
          <Badge variant={row.original.enabled !== false ? 'default' : 'secondary'}>
            {row.original.enabled !== false ? 'On' : 'Off'}
          </Badge>
        </div>
      ),
      size: 140,
    },
    ...(enablePin ? [{
      id: 'pinned',
      header: 'Pinned',
      cell: ({ row }: any) => (
        <button
          onClick={() => pinMut.mutate(row.original.id)}
          disabled={pinMut.isPending}
          className={`p-1 rounded transition-colors ${row.original.isPinned ? 'text-gold bg-gold/10' : 'text-gray-400 hover:text-gold hover:bg-gold/5'}`}
          title={row.original.isPinned ? 'Pinned as Verse of the Day' : 'Pin as Verse of the Day'}
        >
          <Pin className="size-4" fill={row.original.isPinned ? 'currentColor' : 'none'} />
        </button>
      ),
      size: 80,
    }] : []),
    ...fields.slice(0, 3).map(f => ({
      accessorKey: f.key,
      header: f.label,
      cell: ({ row }: any) => {
        const val = row.original[f.key]
        if (isImageField(f.key) && val) {
          return (
            <div className="flex items-center gap-2">
              <img src={getImageSrc(val)} alt="" className="size-8 rounded object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
              <span className="truncate max-w-[150px]">{val}</span>
            </div>
          )
        }
        if (f.type === 'checkbox') return val ? 'Yes' : 'No'
        return <span className="truncate max-w-[200px] block">{String(val ?? '')}</span>
      },
    })),
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
            {enablePin && (
              <DropdownMenuItem onClick={() => pinMut.mutate(row.original.id)} disabled={pinMut.isPending}>
                <Pin className="mr-2 size-4" /> {row.original.isPinned ? 'Unpin' : 'Pin as Verse of the Day'}
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => setConfirmDelete(row.original.id)} className="text-destructive">
              <Trash2 className="mr-2 size-4" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
      size: 60,
    },
  ]

  return (
    <div className="space-y-6">
      {/* Master Section Toggle */}
      <div className={`flex items-center justify-between p-4 rounded-xl border-2 transition-colors ${
        sectionEnabled ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`size-3 rounded-full ${sectionEnabled ? 'bg-green-500' : 'bg-red-500'}`} />
          <div>
            <h2 className="text-sm font-semibold text-gray-900">{title} Section — Homepage Visibility</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {sectionEnabled ? 'This section is VISIBLE on the homepage' : 'This section is HIDDEN from the homepage'}
            </p>
          </div>
        </div>
        <Switch
          checked={sectionEnabled}
          onCheckedChange={() => toggleSection(sectionApiKey, {
            onSuccess: () => queryClient.invalidateQueries({ queryKey: ['settings', 'sections'] }),
          })}
          disabled={sectionToggling}
        />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>{title}</CardTitle>
          <Button onClick={openCreate} className="bg-church-blue hover:bg-church-blue/90">
            <Plus className="mr-1 size-4" /> Add {title.replace(/s$/, '')}
          </Button>
        </CardHeader>
        <CardContent>
          <DataTable
            data={items}
            columns={columns}
            searchKey={fields[0]?.key}
            searchPlaceholder={`Search ${title.toLowerCase()}...`}
            isLoading={isLoading}
          />
        </CardContent>
      </Card>

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit' : 'Create'} {title.replace(/s$/, '')}</DialogTitle>
            <DialogDescription>{editing ? 'Update the details below.' : 'Fill in the details to create a new item.'}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {fields.map(f => (
              <div key={f.key} className="space-y-2">
                <Label>{f.label}</Label>
                {f.type === 'textarea' ? (
                  <RichTextEditor value={form[f.key] ?? ''} onChange={val => setForm({ ...form, [f.key]: val })} />
                ) : f.type === 'checkbox' ? (
                  <div className="flex items-center gap-2">
                    <input type="checkbox" checked={form[f.key] ?? false} onChange={e => setForm({ ...form, [f.key]: e.target.checked })} className="size-4" />
                    <Label className="font-normal">Enabled</Label>
                  </div>
                ) : f.type === 'select' && f.options ? (
                  <Select value={form[f.key] ?? ''} onValueChange={val => setForm({ ...form, [f.key]: val })}>
                    <SelectTrigger><SelectValue placeholder={`Select ${f.label.toLowerCase()}`} /></SelectTrigger>
                    <SelectContent>
                      {f.options.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                    </SelectContent>
                  </Select>
                ) : isImageField(f.key) ? (
                  <div className="space-y-2">
                    {form[f.key] && (
                      <div className="relative inline-block">
                        <img src={getImageSrc(form[f.key])} alt="Preview" className="h-24 rounded-lg object-cover border"
                          onError={e => { (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96"><rect fill="%23f3f4f6" width="96" height="96"/><text x="48" y="54" text-anchor="middle" fill="%239ca3af" font-size="12">No image</text></svg>' }} />
                        <button type="button" onClick={() => setForm(prev => ({ ...prev, [f.key]: '' }))} className="absolute -top-2 -right-2 size-5 bg-destructive text-white rounded-full flex items-center justify-center text-xs">x</button>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <input type="file" ref={el => { fileInputRefs.current[f.key] = el }} accept="image/*" className="hidden"
                        onChange={e => { const file = e.target.files?.[0]; if (file) handleUpload(f.key, file); e.target.value = '' }} />
                      <Button type="button" variant="outline" size="sm" onClick={() => fileInputRefs.current[f.key]?.click()} disabled={uploadingField === f.key}>
                        {uploadingField === f.key ? <span className="animate-spin size-4 border-2 border-gray-300 border-t-church-blue rounded-full mr-1" /> : <Upload className="size-4 mr-1" />}
                        {uploadingField === f.key ? 'Uploading...' : 'Upload'}
                      </Button>
                      <Input value={form[f.key] ?? ''} onChange={e => setForm({ ...form, [f.key]: e.target.value })} placeholder="Or paste image URL" className="flex-1" />
                    </div>
                  </div>
                ) : (
                  <Input
                    type={f.type === 'number' ? 'number' : 'text'}
                    value={form[f.key] ?? ''}
                    onChange={e => setForm({ ...form, [f.key]: f.type === 'number' ? Number(e.target.value) : e.target.value })}
                  />
                )}
              </div>
            ))}
            <div className="space-y-2">
              <Label>Display Order</Label>
              <Input type="number" min="0" value={form.sortOrder ?? 0} onChange={e => setForm({ ...form, sortOrder: Number(e.target.value) })} />
              <p className="text-xs text-muted-foreground">Lower numbers appear first on homepage</p>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button type="submit" disabled={createMut.isPending || updateMut.isPending || uploadingField !== null} className="bg-church-blue hover:bg-church-blue/90">
                {createMut.isPending || updateMut.isPending ? 'Saving...' : 'Save'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!confirmDelete} onOpenChange={(open) => { if (!open) setConfirmDelete(null) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete item?</DialogTitle>
            <DialogDescription>This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => confirmDelete && deleteMut.mutate(confirmDelete)} disabled={deleteMut.isPending}>
              {deleteMut.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
