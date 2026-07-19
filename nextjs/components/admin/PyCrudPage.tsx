'use client'

import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, X, Star } from 'lucide-react'
import { RichTextEditor } from './RichTextEditor'
import { createResourceHooks } from '@/lib/hooks'

interface Field {
  key: string
  label: string
  type: 'text' | 'textarea' | 'number' | 'checkbox'
  placeholder?: string
}

export function PyCrudPage({ endpoint, title, fields }: { endpoint: string; title: string; fields: Field[] }) {
  const queryClient = useQueryClient()
  const { useList, useCreate, useUpdate, useDelete, usePin } = createResourceHooks<any>(endpoint)
  const { data: items = [], isLoading } = useList()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState<Record<string, any>>({})
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [error, setError] = useState('')
  const createMut = useCreate()
  const updateMut = useUpdate()
  const deleteMut = useDelete()
  const featuredMut = usePin()

  const openEdit = (item: any) => { setEditing(item); setForm(item); setShowForm(true); setError('') }
  const openCreate = () => { setEditing(null); setForm({}); setShowForm(true); setError('') }

  const handleSubmit = () => {
    if (editing) {
      updateMut.mutate({ id: editing.id, data: form })
    } else {
      createMut.mutate(form)
    }
  }

  const renderField = (field: Field) => {
    if (field.type === 'textarea') {
      return <RichTextEditor value={form[field.key] || ''} onChange={v => setForm(p => ({ ...p, [field.key]: v }))} />
    }
    return (
      <input
        type={field.type === 'number' ? 'number' : field.type === 'checkbox' ? 'checkbox' : 'text'}
        value={field.type === 'checkbox' ? undefined : (form[field.key] ?? '')}
        checked={field.type === 'checkbox' ? !!form[field.key] : undefined}
        onChange={e => setForm(p => ({ ...p, [field.key]: field.type === 'checkbox' ? e.target.checked : field.type === 'number' ? Number(e.target.value) : e.target.value }))}
        placeholder={field.placeholder}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0b3c5d] focus:border-transparent text-sm"
      />
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#0b3c5d] capitalize">{title}</h1>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-[#0b3c5d] text-white rounded-lg hover:bg-[#0d4a6e]">
          <Plus className="size-4" /> Add {title.replace(/s$/, '')}
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-500">Loading...</div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
          <p className="text-gray-500">No {title.toLowerCase()} yet. Click "Add" to create one.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">#</th>
                {fields.slice(0, 3).map(f => (
                  <th key={f.key} className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">{f.label}</th>
                ))}
                {items[0]?.featured !== undefined && <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Featured</th>}
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {items.map((item: any, i: number) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-500">{i + 1}</td>
                  {fields.slice(0, 3).map(f => (
                    <td key={f.key} className="px-4 py-3 text-sm text-gray-900 max-w-[200px] truncate">{typeof item[f.key] === 'boolean' ? (item[f.key] ? 'Yes' : 'No') : item[f.key] ?? '—'}</td>
                  ))}
                  {item.featured !== undefined && (
                    <td className="px-4 py-3">
                      <button onClick={() => featuredMut.mutate(item.id)} className={`p-1 rounded ${item.featured ? 'text-yellow-500' : 'text-gray-300'} hover:text-yellow-500`}>
                        <Star className={`size-4 ${item.featured ? 'fill-yellow-500' : ''}`} />
                      </button>
                    </td>
                  )}
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openEdit(item)} className="p-1.5 text-gray-400 hover:text-blue-600 rounded"><Pencil className="size-4" /></button>
                      <button onClick={() => setConfirmDelete(item.id)} className="p-1.5 text-gray-400 hover:text-red-600 rounded"><Trash2 className="size-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-[#0b3c5d]">{editing ? 'Edit' : 'Add'} {title.replace(/s$/, '')}</h2>
              <button onClick={() => setShowForm(false)} className="p-1 text-gray-400 hover:text-gray-600"><X className="size-5" /></button>
            </div>
            {error && <div className="mb-3 p-2 bg-red-50 text-red-600 text-sm rounded">{error}</div>}
            <div className="space-y-4">
              {fields.map(f => (
                <div key={f.key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
                  {renderField(f)}
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
              <button onClick={handleSubmit} disabled={createMut.isPending || updateMut.isPending} className="px-4 py-2 bg-[#0b3c5d] text-white rounded-lg hover:bg-[#0d4a6e] disabled:opacity-50">
                {createMut.isPending || updateMut.isPending ? 'Saving...' : editing ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setConfirmDelete(null)}>
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 text-center" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900">Delete?</h3>
            <p className="mt-2 text-sm text-gray-500">This action cannot be undone.</p>
            <div className="flex gap-3 mt-6 justify-center">
              <button onClick={() => setConfirmDelete(null)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
              <button onClick={() => deleteMut.mutate(confirmDelete)} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
