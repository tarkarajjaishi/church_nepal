import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'
import { Plus, Pencil, Trash2, X } from 'lucide-react'

interface Field {
  key: string
  label: string
  type: 'text' | 'textarea' | 'number' | 'checkbox'
}

export function CrudPage({ endpoint, title, fields }: { endpoint: string; title: string; fields: Field[] }) {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState<Record<string, any>>({})
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const { data: items = [], isLoading } = useQuery({
    queryKey: [endpoint],
    queryFn: () => api.get(`/${endpoint}`).then(r => r.data),
  })

  const createMut = useMutation({
    mutationFn: (data: any) => api.post(`/${endpoint}`, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: [endpoint] }); setShowForm(false); setForm({}) },
  })

  const updateMut = useMutation({
    mutationFn: ({ id, data }: any) => api.put(`/${endpoint}/${id}`, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: [endpoint] }); setShowForm(false); setEditing(null); setForm({}) },
  })

  const deleteMut = useMutation({
    mutationFn: (id: string) => api.delete(`/${endpoint}/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: [endpoint] }); setConfirmDelete(null) },
  })

  const openCreate = () => { setEditing(null); setForm({}); setShowForm(true) }
  const openEdit = (item: any) => { setEditing(item); setForm(item); setShowForm(true) }
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editing) {
      updateMut.mutate({ id: editing.id, data: form })
    } else {
      createMut.mutate(form)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#0b3c5d]">{title}</h1>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-[#0b3c5d] text-white rounded-lg text-sm font-medium hover:bg-[#0b3c5d]/90">
          <Plus className="size-4" /> Add {title.replace(/s$/, '')}
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : items.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No items yet. Click "Add" to create one.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {fields.slice(0, 4).map(f => (
                    <th key={f.key} className="px-4 py-3 text-left font-medium text-gray-600">{f.label}</th>
                  ))}
                  <th className="px-4 py-3 text-right font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((item: any) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    {fields.slice(0, 4).map(f => (
                      <td key={f.key} className="px-4 py-3 text-gray-700 max-w-[200px] truncate">
                        {f.type === 'checkbox' ? (item[f.key] ? 'Yes' : 'No') : String(item[f.key] ?? '')}
                      </td>
                    ))}
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

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="text-lg font-bold text-[#0b3c5d]">{editing ? 'Edit' : 'Create'} {title.replace(/s$/, '')}</h2>
              <button onClick={() => setShowForm(false)} className="p-1 text-gray-400 hover:text-gray-600"><X className="size-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {fields.map(f => (
                <div key={f.key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
                  {f.type === 'textarea' ? (
                    <textarea
                      value={form[f.key] ?? ''}
                      onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0b3c5d]"
                      rows={3}
                    />
                  ) : f.type === 'checkbox' ? (
                    <input
                      type="checkbox"
                      checked={form[f.key] ?? false}
                      onChange={e => setForm({ ...form, [f.key]: e.target.checked })}
                      className="size-4"
                    />
                  ) : (
                    <input
                      type={f.type === 'number' ? 'number' : 'text'}
                      value={form[f.key] ?? ''}
                      onChange={e => setForm({ ...form, [f.key]: f.type === 'number' ? Number(e.target.value) : e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0b3c5d]"
                    />
                  )}
                </div>
              ))}
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={createMut.isPending || updateMut.isPending} className="px-5 py-2 bg-[#0b3c5d] text-white rounded-lg text-sm font-medium hover:bg-[#0b3c5d]/90 disabled:opacity-50">
                  {createMut.isPending || updateMut.isPending ? 'Saving...' : 'Save'}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setConfirmDelete(null)}>
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Delete item?</h3>
            <p className="text-sm text-gray-500 mb-6">This action cannot be undone.</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setConfirmDelete(null)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
              <button onClick={() => deleteMut.mutate(confirmDelete)} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700">
                {deleteMut.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
