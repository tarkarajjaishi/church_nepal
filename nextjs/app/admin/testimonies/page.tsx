'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'motion/react'
import { Plus, Edit, Trash2, Star } from 'lucide-react'
import { useTestimonies } from '@/lib/hooks'
import { SkeletonLoader, ErrorState, EmptyState } from '@/components/LoadingStates'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { useQueryClient } from '@tanstack/react-query'
import api from '@/lib/admin/api'
import { Quote } from 'lucide-react'

function TestimonyCard({ testimony, onDelete, onToggleFeatured, deletingId, togglingId }: {
  testimony: any
  onDelete: (id: string) => void
  onToggleFeatured: (t: any) => void
  deletingId: string | null
  togglingId: string | null
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow-md hover:shadow-lg transition p-6"
    >
      <div className="flex items-start gap-4">
        <Quote className="w-8 h-8 text-blue-600 flex-shrink-0 mt-1" />
        <div className="flex-1 min-w-0">
          <p className="text-gray-700 line-clamp-3 italic">{testimony.quote}</p>
          <div className="mt-4 flex items-center justify-between">
            <div>
              <p className="font-semibold text-gray-900">{testimony.name}</p>
              <p className="text-sm text-gray-500">{testimony.role}</p>
            </div>
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className={`w-4 h-4 ${i < testimony.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 pt-4 mt-4 border-t border-gray-100">
        <button
          onClick={() => onToggleFeatured(testimony)}
          disabled={togglingId === testimony.id}
          className={`flex-1 p-2 rounded-lg transition text-sm font-medium flex items-center justify-center gap-1 ${
            testimony.featured ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          } disabled:opacity-50`}
        >
          <Star className={`w-4 h-4 ${testimony.featured ? 'fill-current' : ''}`} />
          {testimony.featured ? 'Featured' : 'Feature'}
        </button>
        <Link
          href={`/admin/testimonies/${testimony.id}`}
          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
        >
          <Edit className="w-4 h-4" />
        </Link>
        <button
          onClick={() => onDelete(testimony.id)}
          disabled={deletingId === testimony.id}
          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  )
}

function TestimoniesPageContent() {
  const { data: testimonies, isPending, error, refetch } = useTestimonies()
  const queryClient = useQueryClient()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this testimony?')) return
    try {
      setDeletingId(id)
      await api.delete(`/testimonies/${id}`)
      queryClient.invalidateQueries({ queryKey: ['testimonies'] })
    } catch (e) {
      alert('Failed to delete')
    } finally {
      setDeletingId(null)
    }
  }

  const handleToggleFeatured = async (t: any) => {
    try {
      setTogglingId(t.id)
      await api.patch(`/testimonies/${t.id}`, { ...t, featured: !t.featured })
      queryClient.invalidateQueries({ queryKey: ['testimonies'] })
    } catch (e) {
      alert('Failed to update')
    } finally {
      setTogglingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Testimonies</h1>
          <p className="text-gray-600 mt-2">Member stories and encouragement</p>
        </div>
        <Link href="/admin/testimonies/new" className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium">
          <Plus className="w-5 h-5" /> New Testimony
        </Link>
      </div>

      {isPending ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <SkeletonLoader key={i} count={1} height="h-40" />)}
        </div>
      ) : error ? (
        <ErrorState message={(error as any)?.message || 'Failed to load testimonies'} action={
          <button onClick={() => refetch()} className="text-sm text-blue-600 hover:underline">Retry</button>
        } />
      ) : testimonies && testimonies.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonies.map((t: any) => (
            <TestimonyCard key={t.id} testimony={t} onDelete={handleDelete} onToggleFeatured={handleToggleFeatured} deletingId={deletingId} togglingId={togglingId} />
          ))}
        </div>
      ) : (
        <EmptyState icon={<Quote className="w-12 h-12" />} title="No testimonies yet" description="Share your first member story." />
      )}
    </div>
  )
}

export default function TestimoniesPage() {
  return (
    <ProtectedRoute requiredRole="editor">
      <ErrorBoundary>
        <TestimoniesPageContent />
      </ErrorBoundary>
    </ProtectedRoute>
  )
}
