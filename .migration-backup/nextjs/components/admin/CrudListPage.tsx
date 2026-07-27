'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'motion/react'
import { Plus, Edit, Trash2, ImageIcon, Star } from 'lucide-react'
import { SkeletonLoader, ErrorState, EmptyState } from '@/components/LoadingStates'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { useQueryClient } from '@tanstack/react-query'
import api from '@/lib/admin/api'

/**
 * Generic modernized list page for simple CRUD collections.
 * Handles: loading skeletons, error state w/ retry, empty state,
 * delete with confirm, featured toggle, category filter, search.
 *
 * config:
 *   endpoint:   API path segment (e.g. 'campaigns')
 *   title:      Page heading
 *   newHref:    Link for "New" button
 *   searchKeys: fields to search on
 *   columns:    table column defs -> { key, label, render?, sortable? }
 *   featured:   whether items have `featured` toggle
 *   color:     primary color class for buttons (e.g. 'bg-emerald-600')
 *   cardView:  render as cards instead of table (for gallery/ministries)
 */
export function CrudListPage({
  endpoint,
  title,
  subtitle,
  newHref,
  searchKeys = [],
  columns = [],
  featured = false,
  color = 'bg-blue-600',
  colorHover = 'hover:bg-blue-700',
  cardView = false,
  icon: Icon = Plus,
}: {
  endpoint: string
  title: string
  subtitle?: string
  newHref: string
  searchKeys?: string[]
  columns?: { key: string; label: string; render?: (item: any) => React.ReactNode; sortable?: boolean }[]
  featured?: boolean
  color?: string
  colorHover?: string
  cardView?: boolean
  icon?: any
}) {
  const { data, isPending, error, refetch } = useGenericQuery(endpoint)
  const queryClient = useQueryClient()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<string | null>(null)

  const items: any[] = data ?? []
  const filtered = items.filter((it) =>
    searchKeys.length === 0
      ? true
      : searchKeys.some((k) => String(it[k] ?? '').toLowerCase().includes(search.toLowerCase()))
  )
  const sorted = sortBy
    ? [...filtered].sort((a, b) => String(a[sortBy] ?? '').localeCompare(String(b[sortBy] ?? '')))
    : filtered

  const handleDelete = async (id: string) => {
    if (!confirm(`Delete this ${title.toLowerCase().slice(0, -1)}?`)) return
    try {
      setDeletingId(id)
      await api.delete(`/${endpoint}/${id}`)
      queryClient.invalidateQueries({ queryKey: [endpoint] })
    } catch (e) { alert('Failed to delete') } finally { setDeletingId(null) }
  }

  const handleToggleFeatured = async (item: any) => {
    try {
      setTogglingId(item.id)
      await api.patch(`/${endpoint}/${item.id}`, { ...item, featured: !item.featured })
      queryClient.invalidateQueries({ queryKey: [endpoint] })
    } catch (e) { alert('Failed to update') } finally { setTogglingId(null) }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
          {subtitle && <p className="text-gray-600 mt-2">{subtitle}</p>}
        </div>
        <Link href={newHref} className={`flex items-center gap-2 px-4 py-2 text-white rounded-lg transition font-medium ${color} ${colorHover}`}>
          <Icon className="w-5 h-5" /> New
        </Link>
      </div>

      {searchKeys.length > 0 && (
        <div className="relative max-w-md">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={`Search ${title.toLowerCase()}...`}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )}

      {isPending ? (
        <div className={cardView ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6' : 'space-y-3'}>
          {[1, 2, 3, 4].map(i => <SkeletonLoader key={i} count={1} height={cardView ? 'h-48' : 'h-16'} />)}
        </div>
      ) : error ? (
        <ErrorState message={(error as any)?.message || `Failed to load ${title.toLowerCase()}`} action={<button onClick={() => refetch()} className="text-sm text-blue-600 hover:underline">Retry</button>} />
      ) : sorted.length > 0 ? (
        cardView ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {sorted.map((item: any) => (
              <motion.div key={item.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-lg shadow-md hover:shadow-lg transition overflow-hidden">
                <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 relative">
                  {item.image ? <img src={item.image} alt={item.title} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><ImageIcon className="w-10 h-10 text-gray-300" /></div>}
                  {featured && item.featured && <div className="absolute top-2 right-2 bg-yellow-400 text-yellow-900 px-2 py-0.5 rounded-full text-xs font-bold flex items-center gap-1"><Star className="w-3 h-3 fill-current" /> Featured</div>}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 line-clamp-1">{item.title}</h3>
                  {columns.find(c => c.key === 'category') && <span className="inline-block mt-1 px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">{item.category}</span>}
                </div>
                <div className="flex items-center gap-1 px-4 pb-4 pt-2 border-t border-gray-100">
                  {featured && (
                    <button onClick={() => handleToggleFeatured(item)} disabled={togglingId === item.id} className={`flex-1 p-2 rounded-lg transition text-xs font-medium flex items-center justify-center gap-1 ${item.featured ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'} disabled:opacity-50`}><Star className={`w-3.5 h-3.5 ${item.featured ? 'fill-current' : ''}`} /></button>
                  )}
                  <Link href={`/${endpoint}/${item.id}`} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"><Edit className="w-4 h-4" /></Link>
                  <button onClick={() => handleDelete(item.id)} disabled={deletingId === item.id} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-50"><Trash2 className="w-4 h-4" /></button>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {columns.map((col) => (
                      <th key={col.key} onClick={() => col.sortable && setSortBy(col.key)} className={`px-4 py-3 text-left font-medium text-gray-600 ${col.sortable ? 'cursor-pointer hover:bg-gray-100' : ''}`}>
                        {col.label} {sortBy === col.key && '↓'}
                      </th>
                    ))}
                    <th className="px-4 py-3 text-right font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {sorted.map((item: any) => (
                    <motion.tr key={item.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="hover:bg-gray-50 transition">
                      {columns.map((col) => (
                        <td key={col.key} className="px-4 py-3 text-gray-700">{col.render ? col.render(item) : String(item[col.key] ?? '—')}</td>
                      ))}
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          {featured && (
                            <button onClick={() => handleToggleFeatured(item)} disabled={togglingId === item.id} className={`p-2 rounded-lg transition disabled:opacity-50 ${item.featured ? 'bg-yellow-100 text-yellow-600' : 'bg-gray-100 text-gray-400'}`}><Star className={`w-4 h-4 ${item.featured ? 'fill-current' : ''}`} /></button>
                          )}
                          <Link href={`/${endpoint}/${item.id}`} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"><Edit className="w-4 h-4" /></Link>
                          <button onClick={() => handleDelete(item.id)} disabled={deletingId === item.id} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-50"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : (
        <EmptyState icon={<Icon className="w-12 h-12" />} title={`No ${title.toLowerCase()} yet`} description={`Add your first ${title.toLowerCase().slice(0, -1)}.`} />
      )}
    </div>
  )
}

// Lightweight wrapper around useQuery to avoid duplicating the hook logic
import { useQuery } from '@tanstack/react-query'
function useGenericQuery(endpoint: string) {
  return useQuery({
    queryKey: [endpoint],
    queryFn: () => api.get(`/${endpoint}`).then(r => r.data),
  })
}

export function ProtectedCrudPage(props: any) {
  return (
    <ProtectedRoute requiredRole={props.requiredRole || 'editor'}>
      <ErrorBoundary>
        <CrudListPage {...props} />
      </ErrorBoundary>
    </ProtectedRoute>
  )
}
