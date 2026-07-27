import { useState, useRef, useEffect } from 'react'
import { useSearchParams } from '@/lib/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { type ColumnDef } from '@tanstack/react-table'
import { uploadFile } from '@/lib/admin/api'
import { Plus, Pencil, Trash2, Upload, ChevronUp, ChevronDown, Pin, CheckCircle2, AlertCircle } from 'lucide-react'
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
    return `${import.meta.env.VITE_API_URL ?? 'http://localhost:3002'}${url}`
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
            <button onClick={() => moveItem(idx, 'up')} disabled={idx === 0 || reorderMut.isPending} className="p-0.5 text-slate-400 hover:text-[#0b3c5d] disabled:opacity-30 transition-colors"><ChevronUp className="size-4" /></button>
            <span className="text-xs font-bold font-mono text-slate-600">{row.original.sortOrder ?? idx}</span>
            <button onClick={() => moveItem(idx, 'down')} disabled={idx === items.length - 1 || reorderMut.isPending} className="p-0.5 text-slate-400 hover:text-[#0b3c5d] disabled:opacity-30 transition-colors"><ChevronDown className="size-4" /></button>
          </div>
        )
      },
      size: 60,
    },
    {
      id: 'enabled',
      header: 'Status',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <Switch
            checked={row.original.enabled ?? true}
            onCheckedChange={() => toggleMut.mutate(row.original.id)}
            disabled={toggleMut.isPending}
            className="data-[state=checked]:bg-green-500"
          />
          <Badge className={row.original.enabled !== false ? 'bg-green-100 text-green-700 hover:bg-green-100 shadow-none' : 'bg-slate-100 text-slate-600 hover:bg-slate-100 shadow-none'}>
            {row.original.enabled !== false ? 'Active' : 'Draft'}
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
          className={`p-2 rounded-lg transition-all ${row.original.isPinned ? 'text-gold bg-gold/10 shadow-sm' : 'text-slate-400 hover:text-gold hover:bg-gold/10'}`}
          title={row.original.isPinned ? 'Pinned as Verse of the Day' : 'Pin as Verse of the Day'}
        >
          <Pin className="size-4.5" fill={row.original.isPinned ? 'currentColor' : 'none'} />
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
            <div className="flex items-center gap-3">
              <img src={getImageSrc(val)} alt="" className="size-10 rounded-lg object-cover shadow-sm border border-slate-200" onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
              <span className="truncate max-w-[150px] font-semibold text-slate-900">{val}</span>
            </div>
          )
        }
        if (f.type === 'checkbox') return val ? <Badge className="bg-[#0b3c5d]/10 text-[#0b3c5d] shadow-none">Yes</Badge> : <Badge className="bg-slate-100 text-slate-500 shadow-none">No</Badge>
        return <span className="truncate max-w-[200px] block font-semibold text-slate-800">{String(val ?? '')}</span>
      },
    })),
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="size-8 p-0 hover:bg-slate-100 rounded-lg">
              <span className="sr-only">Actions</span>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-4.5 text-slate-500"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 rounded-xl p-1.5 shadow-xl border-slate-200">
            <DropdownMenuItem onClick={() => openEdit(row.original)} className="rounded-lg font-semibold py-2 cursor-pointer focus:bg-slate-100">
              <Pencil className="mr-2 size-4 text-[#0b3c5d]" /> Edit Record
            </DropdownMenuItem>
            {enablePin && (
              <DropdownMenuItem onClick={() => pinMut.mutate(row.original.id)} disabled={pinMut.isPending} className="rounded-lg font-semibold py-2 cursor-pointer focus:bg-slate-100">
                <Pin className="mr-2 size-4 text-gold" /> {row.original.isPinned ? 'Unpin from Homepage' : 'Pin to Homepage'}
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => setConfirmDelete(row.original.id)} className="text-red-600 rounded-lg font-semibold py-2 cursor-pointer focus:bg-red-50">
              <Trash2 className="mr-2 size-4 text-red-500" /> Delete Record
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
      size: 60,
    },
  ]

  return (
    <div className="space-y-8">
      {/* Master Section Toggle */}
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl border-2 transition-all duration-300 ${
        sectionEnabled ? 'bg-green-50/50 border-green-200 shadow-sm' : 'bg-white border-slate-200'
      }`}>
        <div className="flex items-center gap-5">
          <div className={`flex items-center justify-center size-12 rounded-full shrink-0 ${sectionEnabled ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400'}`}>
            {sectionEnabled ? <CheckCircle2 className="size-6" /> : <AlertCircle className="size-6" />}
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">{title} Section Visibility</h2>
            <p className="text-sm font-semibold text-slate-500 mt-1">
              {sectionEnabled ? 'This section is currently visible on the public homepage.' : 'This section is currently hidden from the public homepage.'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 bg-white p-2.5 rounded-2xl border border-slate-200 shadow-sm self-start sm:self-auto">
          <span className={`text-sm font-bold uppercase tracking-wider px-2 ${sectionEnabled ? 'text-green-700' : 'text-slate-500'}`}>{sectionEnabled ? 'Visible' : 'Hidden'}</span>
          <Switch
            checked={sectionEnabled}
            onCheckedChange={() => toggleSection(sectionApiKey, {
              onSuccess: () => queryClient.invalidateQueries({ queryKey: ['settings', 'sections'] }),
            })}
            disabled={sectionToggling}
            className="data-[state=checked]:bg-green-500 shadow-inner"
          />
        </div>
      </div>

      <Card className="border border-slate-200 shadow-sm rounded-3xl overflow-hidden bg-white">
        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 bg-slate-50/50 px-8 py-6">
          <div>
            <CardTitle className="text-2xl font-bold text-slate-900">{title}</CardTitle>
            <p className="text-sm font-semibold text-slate-500 mt-1.5">Manage your {title.toLowerCase()} records</p>
          </div>
          <Button onClick={openCreate} className="bg-[#0b3c5d] hover:bg-[#1f6f8b] text-white font-bold shadow-lg shadow-[#0b3c5d]/20 transition-all rounded-xl px-5 h-11 hover:-translate-y-0.5">
            <Plus className="mr-2 size-5" /> Add New
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="px-8 py-6">
            <DataTable
              data={items}
              columns={columns}
              searchKey={fields[0]?.key}
              searchPlaceholder={`Search ${title.toLowerCase()}...`}
              isLoading={isLoading}
            />
          </div>
        </CardContent>
      </Card>

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 border-0 rounded-2xl shadow-2xl">
          <div className="bg-[#0b3c5d] px-8 py-6 rounded-t-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/10 pointer-events-none" />
            <div className="relative z-10">
              <DialogTitle className="text-2xl font-bold text-white font-serif">{editing ? 'Edit' : 'Create'} {title.replace(/s$/, '')}</DialogTitle>
              <DialogDescription className="text-sky-200 mt-1 font-medium">{editing ? 'Update the details below.' : 'Fill in the details to create a new item.'}</DialogDescription>
            </div>
          </div>
          <form onSubmit={handleSubmit} className="px-8 py-6 space-y-6 bg-white">
            {fields.map(f => (
              <div key={f.key} className="space-y-2.5">
                <Label className="text-sm font-bold text-slate-700 uppercase tracking-wide">{f.label}</Label>
                {f.type === 'textarea' ? (
                  <div className="border-2 border-slate-200 rounded-xl overflow-hidden focus-within:border-[#0b3c5d] focus-within:ring-4 focus-within:ring-[#0b3c5d]/10 transition-all">
                    <RichTextEditor value={form[f.key] ?? ''} onChange={val => setForm({ ...form, [f.key]: val })} />
                  </div>
                ) : f.type === 'checkbox' ? (
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <Switch 
                      checked={form[f.key] ?? false} 
                      onCheckedChange={val => setForm({ ...form, [f.key]: val })} 
                      className="data-[state=checked]:bg-[#0b3c5d]"
                    />
                    <Label className="font-semibold text-slate-700 cursor-pointer">Enabled / Active</Label>
                  </div>
                ) : f.type === 'select' && f.options ? (
                  <Select value={form[f.key] ?? ''} onValueChange={val => setForm({ ...form, [f.key]: val })}>
                    <SelectTrigger className="w-full h-12 px-4 border-2 border-slate-200 rounded-xl font-medium focus:border-[#0b3c5d] focus:ring-4 focus:ring-[#0b3c5d]/10 transition-all">
                      <SelectValue placeholder={`Select ${f.label.toLowerCase()}`} />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-slate-200 shadow-xl">
                      {f.options.map(opt => <SelectItem key={opt} value={opt} className="font-medium focus:bg-slate-100">{opt}</SelectItem>)}
                    </SelectContent>
                  </Select>
                ) : isImageField(f.key) ? (
                  <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                    {form[f.key] && (
                      <div className="relative inline-block group">
                        <img src={getImageSrc(form[f.key])} alt="Preview" className="h-32 w-auto rounded-xl object-cover border-2 border-white shadow-md transition-transform group-hover:scale-[1.02]"
                          onError={e => { (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96"><rect fill="%23f8fafc" width="96" height="96"/><text x="48" y="54" text-anchor="middle" fill="%2394a3b8" font-size="12" font-family="sans-serif" font-weight="bold">No image</text></svg>' }} />
                        <button type="button" onClick={() => setForm(prev => ({ ...prev, [f.key]: '' }))} className="absolute -top-3 -right-3 size-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-xs shadow-lg transition-transform hover:scale-110 border-2 border-white">
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    )}
                    <div className="flex gap-3">
                      <input type="file" ref={el => { fileInputRefs.current[f.key] = el }} accept="image/*" className="hidden"
                        onChange={e => { const file = e.target.files?.[0]; if (file) handleUpload(f.key, file); e.target.value = '' }} />
                      <Button type="button" variant="outline" className="h-11 px-5 border-2 border-slate-200 rounded-xl hover:border-slate-300 hover:bg-slate-100 font-bold text-slate-700" onClick={() => fileInputRefs.current[f.key]?.click()} disabled={uploadingField === f.key}>
                        {uploadingField === f.key ? <span className="animate-spin size-4 border-2 border-slate-300 border-t-[#0b3c5d] rounded-full mr-2" /> : <Upload className="size-4 mr-2" />}
                        {uploadingField === f.key ? 'Uploading...' : 'Upload Image'}
                      </Button>
                      <Input value={form[f.key] ?? ''} onChange={e => setForm({ ...form, [f.key]: e.target.value })} placeholder="Or paste image URL" className="flex-1 h-11 px-4 border-2 border-slate-200 rounded-xl font-medium focus:border-[#0b3c5d] focus:ring-4 focus:ring-[#0b3c5d]/10 transition-all bg-white" />
                    </div>
                  </div>
                ) : (
                  <Input
                    type={f.type === 'number' ? 'number' : 'text'}
                    value={form[f.key] ?? ''}
                    onChange={e => setForm({ ...form, [f.key]: f.type === 'number' ? Number(e.target.value) : e.target.value })}
                    className="w-full h-11 px-4 border-2 border-slate-200 rounded-xl font-medium focus:border-[#0b3c5d] focus:ring-4 focus:ring-[#0b3c5d]/10 transition-all bg-white"
                  />
                )}
              </div>
            ))}
            <div className="space-y-2.5">
              <Label className="text-sm font-bold text-slate-700 uppercase tracking-wide">Display Order</Label>
              <Input type="number" min="0" value={form.sortOrder ?? 0} onChange={e => setForm({ ...form, sortOrder: Number(e.target.value) })} className="w-full h-11 px-4 border-2 border-slate-200 rounded-xl font-medium focus:border-[#0b3c5d] focus:ring-4 focus:ring-[#0b3c5d]/10 transition-all bg-white" />
              <p className="text-xs font-semibold text-slate-500">Lower numbers appear first on homepage</p>
            </div>
            
            <div className="pt-6 border-t border-slate-100 flex items-center justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)} className="h-11 px-6 rounded-xl border-2 border-slate-200 hover:bg-slate-50 font-bold text-slate-600">Cancel</Button>
              <Button type="submit" disabled={createMut.isPending || updateMut.isPending || uploadingField !== null} className="h-11 px-8 rounded-xl bg-[#0b3c5d] hover:bg-[#1f6f8b] text-white font-bold shadow-lg shadow-[#0b3c5d]/20 transition-all hover:-translate-y-0.5 disabled:hover:translate-y-0">
                {createMut.isPending || updateMut.isPending ? 'Saving...' : 'Save Record'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!confirmDelete} onOpenChange={(open) => { if (!open) setConfirmDelete(null) }}>
        <DialogContent className="max-w-sm rounded-2xl p-0 border-0 overflow-hidden shadow-2xl">
          <div className="p-8 text-center bg-white">
            <div className="size-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-5">
              <AlertCircle className="size-8 text-red-500" />
            </div>
            <DialogTitle className="text-xl font-bold text-slate-900 mb-2">Delete this record?</DialogTitle>
            <DialogDescription className="text-sm font-medium text-slate-500">
              This action cannot be undone. This will permanently remove the record from your system.
            </DialogDescription>
          </div>
          <div className="p-4 bg-slate-50 flex items-center justify-center gap-3">
            <Button variant="outline" onClick={() => setConfirmDelete(null)} className="flex-1 h-11 rounded-xl border-2 border-slate-200 hover:bg-white font-bold text-slate-600">Cancel</Button>
            <Button variant="destructive" onClick={() => confirmDelete && deleteMut.mutate(confirmDelete)} disabled={deleteMut.isPending} className="flex-1 h-11 rounded-xl bg-red-500 hover:bg-red-600 font-bold shadow-md shadow-red-500/20">
              {deleteMut.isPending ? 'Deleting...' : 'Yes, Delete'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
