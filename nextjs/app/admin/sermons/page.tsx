'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'motion/react'
import { Plus, Edit, Trash2, Play, ExternalLink } from 'lucide-react'
import { useSermons } from '@/lib/hooks'
import { SkeletonLoader, ErrorState, EmptyState } from '@/components/LoadingStates'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { useQueryClient } from '@tanstack/react-query'
import api from '@/lib/admin/api'

function SermonCard({ sermon, onDelete, deletingId }: {
  sermon: any
  onDelete: (id: string) => void
  deletingId: string | null
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow-md hover:shadow-lg transition overflow-hidden"
    >
      <div className="relative aspect-video bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
        {sermon.image ? (
          <img src={sermon.image} alt={sermon.title} className="w-full h-full object-cover" />
        ) : (
          <Play className="w-12 h-12 text-white/70" />
        )}
        {sermon.video_url && (
          <a href={sermon.video_url} target="_blank" rel="noopener noreferrer" className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/50 transition">
            <Play className="w-12 h-12 text-white" />
          </a>
        )}
      </div>

      <div className="p-4 space-y-2">
        <h3 className="font-semibold text-gray-900 line-clamp-2">{sermon.title}</h3>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span>{sermon.speaker}</span>
          {sermon.series && <span className="text-gray-400">· {sermon.series}</span>}
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          {sermon.date && <span>{sermon.date}</span>}
          {sermon.duration && <span>· {sermon.duration}</span>}
        </div>
      </div>

      <div className="flex items-center gap-1 px-4 pb-4 pt-2 border-t border-gray-100">
        {sermon.video_url && (
          <a href={sermon.video_url} target="_blank" rel="noopener noreferrer" className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition" title="Watch">
            <ExternalLink className="w-4 h-4" />
          </a>
        )}
        <Link href={`/admin/sermons/${sermon.id}`} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition" title="Edit">
          <Edit className="w-4 h-4" />
        </Link>
        <button onClick={() => onDelete(sermon.id)} disabled={deletingId === sermon.id} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-50" title="Delete">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  )
}

function SermonsPageContent() {
  const { data: sermons, isPending, error, refetch } = useSermons()
  const queryClient = useQueryClient()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const filtered = sermons?.filter((s: any) =>
    s.title.toLowerCase().includes(search.toLowerCase()) ||
    (s.speaker || '').toLowerCase().includes(search.toLowerCase())
  )

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this sermon?')) return
    try {
      setDeletingId(id)
      await api.delete(`/sermons/${id}`)
      queryClient.invalidateQueries({ queryKey: ['sermons'] })
    } catch (e) { alert('Failed to delete') } finally { setDeletingId(null) }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sermons</h1>
          <p className="text-gray-600 mt-2">Sermon archive and media</p>
        </div>
        <Link href="/admin/sermons/new" className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium">
          <Plus className="w-5 h-5" /> New Sermon
        </Link>
      </div>

      <div className="relative max-w-md">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search sermons..."
          className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <Play className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
      </div>

      {isPending ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <SkeletonLoader key={i} count={1} height="h-56" />)}
        </div>
      ) : error ? (
        <ErrorState message={(error as any)?.message || 'Failed to load sermons'} action={<button onClick={() => refetch()} className="text-sm text-blue-600 hover:underline">Retry</button>} />
      ) : filtered && filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((s: any) => (
            <SermonCard key={s.id} sermon={s} onDelete={handleDelete} deletingId={deletingId} />
          ))}
        </div>
      ) : (
        <EmptyState icon={<Play className="w-12 h-12" />} title="No sermons found" description="Add your first sermon." />
      )}
    </div>
  )
}

export default function SermonsPage() {
  return (
    <ProtectedRoute requiredRole="editor">
      <ErrorBoundary>
        <SermonsPageContent />
      </ErrorBoundary>
    </ProtectedRoute>
  )
}
