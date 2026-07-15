'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/admin/api'
import { Plus, Pencil, Trash2, X, ChevronUp, ChevronDown, CheckSquare, Circle, CheckCircle2, Clock } from 'lucide-react'

interface Todo {
  id: string
  title: string
  description: string
  priority: string
  status: string
  dueDate: string
  sortOrder: number | null
}

const priorityColors: Record<string, string> = {
  high: 'bg-red-100 text-red-700 border-red-200',
  medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  low: 'bg-green-100 text-green-700 border-green-200',
}

const statusIcons: Record<string, any> = {
  pending: Circle,
  in_progress: Clock,
  done: CheckCircle2,
}

const statusColors: Record<string, string> = {
  pending: 'text-gray-500',
  in_progress: 'text-blue-500',
  done: 'text-green-500',
}

export default function TodosPage() {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Todo | null>(null)
  const [form, setForm] = useState<Record<string, any>>({})
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState('all')

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['todos'],
    queryFn: () => api.get('/todos').then(r => r.data),
  })

  const createMut = useMutation({
    mutationFn: (data: any) => api.post('/todos', data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['todos'] }); setShowForm(false); setForm({}) },
  })

  const updateMut = useMutation({
    mutationFn: ({ id, data }: any) => api.put(`/todos/${id}`, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['todos'] }); setShowForm(false); setEditing(null); setForm({}) },
  })

  const deleteMut = useMutation({
    mutationFn: (id: string) => api.delete(`/todos/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['todos'] }); setConfirmDelete(null) },
  })

  const toggleMut = useMutation({
    mutationFn: (id: string) => api.put(`/todos/${id}/toggle`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['todos'] }),
  })

  const reorderMut = useMutation({
    mutationFn: ({ id, sort_order }: { id: string; sort_order: number }) => api.put(`/todos/${id}/reorder`, { sort_order }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['todos'] }),
  })

  const moveItem = (index: number, direction: 'up' | 'down') => {
    const item = filteredItems[index]
    const swapIndex = direction === 'up' ? index - 1 : index + 1
    if (swapIndex < 0 || swapIndex >= filteredItems.length) return
    const swapItem = filteredItems[swapIndex]
    reorderMut.mutate({ id: item.id, sort_order: swapItem.sortOrder ?? swapIndex })
    reorderMut.mutate({ id: swapItem.id, sort_order: item.sortOrder ?? index })
  }

  const filteredItems = filterStatus === 'all' ? items : items.filter((t: Todo) => t.status === filterStatus)
  const pendingCount = items.filter((t: Todo) => t.status === 'pending').length
  const doneCount = items.filter((t: Todo) => t.status === 'done').length

  const openCreate = () => { setForm({ title: '', description: '', priority: 'medium', status: 'pending', dueDate: '' }); setEditing(null); setShowForm(true) }
  const openEdit = (item: Todo) => { setEditing(item); setForm({ title: item.title, description: item.description, priority: item.priority, status: item.status, dueDate: item.dueDate }); setShowForm(true) }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title) return
    if (editing) updateMut.mutate({ id: editing.id, data: form })
    else createMut.mutate(form)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-[#0b3c5d]">Todos</h1>
          <span className="text-sm text-gray-500">{pendingCount} pending · {doneCount} done</span>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-[#0b3c5d] text-white rounded-lg text-sm font-medium hover:bg-[#0b3c5d]/90">
          <Plus className="size-4" /> New Todo
        </button>
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-4">
        {['all', 'pending', 'in_progress', 'done'].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filterStatus === s ? 'bg-[#0b3c5d] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {s === 'all' ? 'All' : s === 'in_progress' ? 'In Progress' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : filteredItems.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No todos {filterStatus !== 'all' ? `with status "${filterStatus}"` : 'yet'}. Click "New Todo" to add one.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-3 py-3 text-center font-medium text-gray-600 w-16">#</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-600 w-20">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Title</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-600">Priority</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Due Date</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredItems.map((item: Todo, index: number) => {
                  const StatusIcon = statusIcons[item.status] || Circle
                  return (
                    <tr key={item.id} className={`hover:bg-gray-50 ${item.status === 'done' ? 'opacity-60' : ''}`}>
                      <td className="px-3 py-3 text-center">
                        <div className="flex flex-col items-center gap-0.5">
                          <button onClick={() => moveItem(index, 'up')} disabled={index === 0} className="p-0.5 text-gray-400 hover:text-[#0b3c5d] disabled:opacity-30"><ChevronUp className="size-3.5" /></button>
                          <span className="text-xs font-mono text-gray-500">{item.sortOrder ?? index}</span>
                          <button onClick={() => moveItem(index, 'down')} disabled={index === filteredItems.length - 1} className="p-0.5 text-gray-400 hover:text-[#0b3c5d] disabled:opacity-30"><ChevronDown className="size-3.5" /></button>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button onClick={() => toggleMut.mutate(item.id)} className={`inline-flex items-center gap-1 ${statusColors[item.status]}`}>
                          <StatusIcon className="size-5" />
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`font-medium text-gray-900 ${item.status === 'done' ? 'line-through text-gray-500' : ''}`}>{item.title}</span>
                        {item.description && <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{item.description}</p>}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${priorityColors[item.priority] || priorityColors.medium}`}>
                          {item.priority}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{item.dueDate || '—'}</td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => openEdit(item)} className="p-1.5 text-gray-400 hover:text-blue-600"><Pencil className="size-4" /></button>
                        <button onClick={() => setConfirmDelete(item.id)} className="p-1.5 text-gray-400 hover:text-red-600 ml-1"><Trash2 className="size-4" /></button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => { setShowForm(false); setEditing(null) }}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="text-lg font-bold text-[#0b3c5d]">{editing ? 'Edit Todo' : 'New Todo'}</h2>
              <button onClick={() => { setShowForm(false); setEditing(null) }} className="p-1 text-gray-400 hover:text-gray-600"><X className="size-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input value={form.title ?? ''} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0b3c5d]" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea value={form.description ?? ''} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0b3c5d]" rows={3} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select value={form.priority ?? 'medium'} onChange={e => setForm({ ...form, priority: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0b3c5d]">
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select value={form.status ?? 'pending'} onChange={e => setForm({ ...form, status: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0b3c5d]">
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="done">Done</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                  <input type="date" value={form.dueDate ?? ''} onChange={e => setForm({ ...form, dueDate: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0b3c5d]" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={createMut.isPending || updateMut.isPending} className="px-5 py-2 bg-[#0b3c5d] text-white rounded-lg text-sm font-medium hover:bg-[#0b3c5d]/90 disabled:opacity-50">
                  {createMut.isPending || updateMut.isPending ? 'Saving...' : editing ? 'Save' : 'Create'}
                </button>
                <button type="button" onClick={() => { setShowForm(false); setEditing(null) }} className="px-5 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setConfirmDelete(null)}>
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Delete this todo?</h3>
            <p className="text-sm text-gray-500 mb-6">This action cannot be undone.</p>
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
