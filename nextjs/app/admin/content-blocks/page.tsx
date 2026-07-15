'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api, { uploadFile } from '@/lib/admin/api'
import { Plus, Pencil, Trash2, X, ChevronUp, ChevronDown, LayoutGrid, Upload } from 'lucide-react'
import { RichTextEditor } from '@/components/admin/RichTextEditor'

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

const emptyForm = { section_key: '', title: '', subtitle: '', body: '', image: '', icon: '' }

export default function ContentBlocksPage() {
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState<ContentBlock | null>(null)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState<Record<string, any>>(emptyForm)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [uploadingField, setUploadingField] = useState<string | null>(null)

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['content-blocks'],
    queryFn: () => api.get('/content-blocks').then(r => r.data),
  })

  const createMut = useMutation({
    mutationFn: (data: any) => api.post('/content-blocks', data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['content-blocks'] }); setCreating(false); setForm(emptyForm) },
  })

  const updateMut = useMutation({
    mutationFn: ({ id, data }: any) => api.put(`/content-blocks/${id}`, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['content-blocks'] }); setEditing(null); setForm(emptyForm) },
  })

  const deleteMut = useMutation({
    mutationFn: (id: string) => api.delete(`/content-blocks/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['content-blocks'] }); setConfirmDelete(null) },
  })

  const toggleMut = useMutation({
    mutationFn: (id: string) => api.put(`/content-blocks/${id}/toggle`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['content-blocks'] }),
  })

  const reorderMut = useMutation({
    mutationFn: ({ id, sort_order }: { id: string; sort_order: number }) => api.put(`/content-blocks/${id}/reorder`, { sort_order }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['content-blocks'] }),
  })

  const moveItem = (index: number, direction: 'up' | 'down') => {
    const item = items[index]
    const swapIndex = direction === 'up' ? index - 1 : index + 1
    if (swapIndex < 0 || swapIndex >= items.length) return
    const swapItem = items[swapIndex]
    reorderMut.mutate({ id: item.id, sort_order: swapItem.sortOrder ?? swapIndex })
    reorderMut.mutate({ id: swapItem.id, sort_order: item.sortOrder ?? index })
  }

  const openCreate = () => { setForm(emptyForm); setCreating(true) }
  const openEdit = (item: ContentBlock) => { setEditing(item); setForm({ title: item.title, subtitle: item.subtitle || '', body: item.body || '', image: item.image || '', icon: item.icon || '' }); }

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.section_key || !form.title) return
    createMut.mutate({
      section_key: form.section_key,
      title: form.title,
      subtitle: form.subtitle || '',
      body: form.body || '',
      image: form.image || '',
      icon: form.icon || '',
    })
  }

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault()
    if (editing) updateMut.mutate({ id: editing.id, data: form })
  }

  const handleUpload = async (fieldKey: string, file: File) => {
    setUploadingField(fieldKey)
    try {
      const result = await uploadFile(file)
      setForm(prev => ({ ...prev, [fieldKey]: result.url }))
    } catch (err: any) {
      alert(`Upload failed: ${err.message}`)
    } finally {
      setUploadingField(null)
    }
  }

  const getImageSrc = (url: string) => {
    if (!url) return ''
    if (url.startsWith('http')) return url
    return `http://localhost:3002${url}`
  }

  const isModalOpen = creating || !!editing

  return (
    <div>
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LayoutGrid className="size-5 text-[#0b3c5d]" />
            <div>
              <h1 className="text-2xl font-bold text-[#0b3c5d]">Homepage Content Sections</h1>
              <p className="text-sm text-gray-500">Edit, create, toggle visibility, and reorder sections on the homepage.</p>
            </div>
          </div>
          <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-[#0b3c5d] text-white rounded-lg text-sm font-medium hover:bg-[#0b3c5d]/90">
            <Plus className="size-4" /> New Section
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : items.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No content blocks yet. Click "New Section" to create one.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-3 py-3 text-center font-medium text-gray-600 w-16">#</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-600 w-20">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Section Key</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Title</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Subtitle</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((item: ContentBlock, index: number) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-3 py-3 text-center">
                      <div className="flex flex-col items-center gap-0.5">
                        <button onClick={() => moveItem(index, 'up')} disabled={index === 0} className="p-0.5 text-gray-400 hover:text-[#0b3c5d] disabled:opacity-30"><ChevronUp className="size-3.5" /></button>
                        <span className="text-xs font-mono text-gray-500">{item.sortOrder ?? index}</span>
                        <button onClick={() => moveItem(index, 'down')} disabled={index === items.length - 1} className="p-0.5 text-gray-400 hover:text-[#0b3c5d] disabled:opacity-30"><ChevronDown className="size-3.5" /></button>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => toggleMut.mutate(item.id)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${item.enabled ? 'bg-green-500' : 'bg-gray-300'}`}>
                        <span className={`inline-block size-4 transform rounded-full bg-white transition-transform ${item.enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                      </button>
                    </td>
                    <td className="px-4 py-3 text-gray-500 font-mono text-xs">{item.sectionKey}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{item.title}</td>
                    <td className="px-4 py-3 text-gray-500 max-w-[300px] truncate">{item.subtitle}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => openEdit(item)} className="p-1.5 text-gray-400 hover:text-blue-600"><Pencil className="size-4" /></button>
                      <button onClick={() => setConfirmDelete(item.id)} className="p-1.5 text-gray-400 hover:text-red-600 ml-1"><Trash2 className="size-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => { setCreating(false); setEditing(null); setForm(emptyForm) }}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="text-lg font-bold text-[#0b3c5d]">{creating ? 'Create New Section' : `Edit: ${editing?.sectionKey}`}</h2>
              <button onClick={() => { setCreating(false); setEditing(null); setForm(emptyForm) }} className="p-1 text-gray-400 hover:text-gray-600"><X className="size-5" /></button>
            </div>
            <form onSubmit={creating ? handleCreate : handleUpdate} className="p-5 space-y-4">
              {creating && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Section Key *</label>
                  <input value={form.section_key ?? ''} onChange={e => setForm({ ...form, section_key: e.target.value })} placeholder="e.g. my_custom_section" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0b3c5d]" required />
                  <p className="text-xs text-gray-400 mt-1">Unique identifier. Use lowercase with underscores (e.g. my_new_section)</p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input value={form.title ?? ''} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0b3c5d]" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subtitle</label>
                <textarea value={form.subtitle ?? ''} onChange={e => setForm({ ...form, subtitle: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0b3c5d]" rows={2} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Body Content</label>
                <RichTextEditor value={form.body || ''} onChange={val => setForm({ ...form, body: val })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Image</label>
                {form.image && (
                  <div className="relative inline-block mb-2">
                    <img src={getImageSrc(form.image)} alt="Preview" className="h-24 rounded-lg object-cover border border-gray-200" />
                    <button type="button" onClick={() => setForm(prev => ({ ...prev, image: '' }))} className="absolute -top-2 -right-2 size-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs">x</button>
                  </div>
                )}
                <div className="flex gap-2">
                  <input type="file" accept="image/*" className="hidden" id="cb-image-upload" onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload('image', f); e.target.value = '' }} />
                  <button type="button" onClick={() => document.getElementById('cb-image-upload')?.click()} disabled={uploadingField === 'image'} className="flex items-center gap-2 px-3 py-2 border border-dashed border-gray-300 rounded-lg text-sm text-gray-600 hover:border-[#0b3c5d] hover:text-[#0b3c5d] disabled:opacity-50">
                    {uploadingField === 'image' ? <span className="animate-spin size-4 border-2 border-gray-300 border-t-[#0b3c5d] rounded-full" /> : <Upload className="size-4" />}
                    {uploadingField === 'image' ? 'Uploading...' : 'Upload Image'}
                  </button>
                  <input value={form.image ?? ''} onChange={e => setForm({ ...form, image: e.target.value })} placeholder="Or paste URL" className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0b3c5d]" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Icon (lucide-react name)</label>
                <input value={form.icon ?? ''} onChange={e => setForm({ ...form, icon: e.target.value })} placeholder="e.g. Sparkles, Heart, BookOpen" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0b3c5d]" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={createMut.isPending || updateMut.isPending} className="px-5 py-2 bg-[#0b3c5d] text-white rounded-lg text-sm font-medium hover:bg-[#0b3c5d]/90 disabled:opacity-50">
                  {createMut.isPending || updateMut.isPending ? 'Saving...' : creating ? 'Create Section' : 'Save Changes'}
                </button>
                <button type="button" onClick={() => { setCreating(false); setEditing(null); setForm(emptyForm) }} className="px-5 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setConfirmDelete(null)}>
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Delete this section?</h3>
            <p className="text-sm text-gray-500 mb-6">This will permanently remove it from the homepage.</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setConfirmDelete(null)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
              <button onClick={() => deleteMut.mutate(confirmDelete)} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
