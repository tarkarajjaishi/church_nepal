'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/admin/api'
import { Plus, Pencil, Trash2, X, ChevronUp, ChevronDown, Layout } from 'lucide-react'

interface ContentBlock {
  id: string
  section_key: string
  title: string
  subtitle: string | null
  body: string | null
  image: string | null
  icon: string | null
  items: any
  enabled: boolean | null
  sort_order: number | null
}

export default function ContentBlocksPage() {
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState<ContentBlock | null>(null)
  const [form, setForm] = useState<Record<string, any>>({})
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['content-blocks'],
    queryFn: () => api.get('/content-blocks').then(r => r.data),
  })

  const updateMut = useMutation({
    mutationFn: ({ id, data }: any) => api.put(`/content-blocks/${id}`, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['content-blocks'] }); setEditing(null); setForm({}) },
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
    reorderMut.mutate({ id: item.id, sort_order: swapItem.sort_order ?? swapIndex })
    reorderMut.mutate({ id: swapItem.id, sort_order: item.sort_order ?? index })
  }

  const openEdit = (item: ContentBlock) => { setEditing(item); setForm({ title: item.title, subtitle: item.subtitle || '', body: item.body || '', image: item.image || '', icon: item.icon || '' }); }
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editing) updateMut.mutate({ id: editing.id, data: form })
  }

  return (
    <div>
      {/* Master toggle */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Layout className="size-5 text-[#0b3c5d]" />
          <h1 className="text-2xl font-bold text-[#0b3c5d]">Homepage Content Sections</h1>
        </div>
        <p className="text-sm text-gray-500">Edit content, toggle visibility, and reorder sections on the homepage.</p>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-3 py-3 text-center font-medium text-gray-600 w-16">#</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600 w-20">Status</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Section</th>
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
                      <span className="text-xs font-mono text-gray-500">{item.sort_order ?? index}</span>
                      <button onClick={() => moveItem(index, 'down')} disabled={index === items.length - 1} className="p-0.5 text-gray-400 hover:text-[#0b3c5d] disabled:opacity-30"><ChevronDown className="size-3.5" /></button>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => toggleMut.mutate(item.id)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${item.enabled ? 'bg-green-500' : 'bg-gray-300'}`}>
                      <span className={`inline-block size-4 transform rounded-full bg-white transition-transform ${item.enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </td>
                  <td className="px-4 py-3 text-gray-500 font-mono text-xs">{item.section_key}</td>
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
        )}
      </div>

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setEditing(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="text-lg font-bold text-[#0b3c5d]">Edit: {editing.section_key}</h2>
              <button onClick={() => setEditing(null)} className="p-1 text-gray-400 hover:text-gray-600"><X className="size-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input value={form.title ?? ''} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0b3c5d]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subtitle</label>
                <textarea value={form.subtitle ?? ''} onChange={e => setForm({ ...form, subtitle: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0b3c5d]" rows={2} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Body Content</label>
                <textarea value={form.body ?? ''} onChange={e => setForm({ ...form, body: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0b3c5d]" rows={4} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                  <input value={form.image ?? ''} onChange={e => setForm({ ...form, image: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0b3c5d]" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Icon</label>
                  <input value={form.icon ?? ''} onChange={e => setForm({ ...form, icon: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0b3c5d]" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={updateMut.isPending} className="px-5 py-2 bg-[#0b3c5d] text-white rounded-lg text-sm font-medium hover:bg-[#0b3c5d]/90 disabled:opacity-50">
                  {updateMut.isPending ? 'Saving...' : 'Save'}
                </button>
                <button type="button" onClick={() => setEditing(null)} className="px-5 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
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
