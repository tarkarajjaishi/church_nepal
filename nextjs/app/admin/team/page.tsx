'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'motion/react'
import { Plus, Edit, Trash2, Star } from 'lucide-react'
import { useMembers } from '@/lib/hooks'
import { SkeletonLoader, ErrorState, EmptyState } from '@/components/LoadingStates'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { useQueryClient } from '@tanstack/react-query'
import api from '@/lib/admin/api'
import { Users } from 'lucide-react'

function TeamCard({ member, onDelete, onToggleFeatured, deletingId, togglingId }: {
  member: any
  onDelete: (id: string) => void
  onToggleFeatured: (m: any) => void
  deletingId: string | null
  togglingId: string | null
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow-md hover:shadow-lg transition overflow-hidden"
    >
      <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 relative">
        {member.image ? (
          <img src={member.image} alt={member.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Users className="w-12 h-12 text-gray-300" />
          </div>
        )}
        {member.featured && (
          <div className="absolute top-2 right-2 bg-yellow-400 text-yellow-900 px-2 py-0.5 rounded-full text-xs font-bold flex items-center gap-1">
            <Star className="w-3 h-3 fill-current" /> Featured
          </div>
        )}
      </div>

      <div className="p-4 space-y-2">
        <h3 className="font-semibold text-gray-900">{member.name}</h3>
        <p className="text-sm text-gray-600">{member.role}</p>
        {member.category && (
          <span className="inline-block px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full font-medium">
            {member.category}
          </span>
        )}
        {member.bio && <p className="text-xs text-gray-500 line-clamp-2 mt-2">{member.bio}</p>}
      </div>

      <div className="flex items-center gap-1 px-4 pb-4 pt-2 border-t border-gray-100">
        <button
          onClick={() => onToggleFeatured(member)}
          disabled={togglingId === member.id}
          className={`flex-1 p-2 rounded-lg transition text-xs font-medium flex items-center justify-center gap-1 ${
            member.featured ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          } disabled:opacity-50`}
        >
          <Star className={`w-3.5 h-3.5 ${member.featured ? 'fill-current' : ''}`} />
          {member.featured ? 'Featured' : 'Feature'}
        </button>
        <Link href={`/admin/team/${member.id}`} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition">
          <Edit className="w-4 h-4" />
        </Link>
        <button onClick={() => onDelete(member.id)} disabled={deletingId === member.id} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-50">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  )
}

function TeamPageContent() {
  const { data: members, isPending, error, refetch } = useMembers()
  const queryClient = useQueryClient()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [filterCategory, setFilterCategory] = useState<string | null>(null)

  const categories = members ? Array.from(new Set(members.map((m: any) => m.category))) : []
  const filtered = filterCategory ? members?.filter((m: any) => m.category === filterCategory) : members

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this team member?')) return
    try {
      setDeletingId(id)
      await api.delete(`/team/${id}`)
      queryClient.invalidateQueries({ queryKey: ['team'] })
    } catch (e) { alert('Failed to delete') } finally { setDeletingId(null) }
  }

  const handleToggleFeatured = async (m: any) => {
    try {
      setTogglingId(m.id)
      await api.patch(`/team/${m.id}`, { ...m, featured: !m.featured })
      queryClient.invalidateQueries({ queryKey: ['team'] })
    } catch (e) { alert('Failed to update') } finally { setTogglingId(null) }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Team Members</h1>
          <p className="text-gray-600 mt-2">Church staff and leadership</p>
        </div>
        <Link href="/admin/team/new" className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium">
          <Plus className="w-5 h-5" /> New Member
        </Link>
      </div>

      {!isPending && categories.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setFilterCategory(null)} className={`px-4 py-2 rounded-lg font-medium transition ${filterCategory === null ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>All</button>
          {(categories as string[]).map((c: string) => (
            <button key={c} onClick={() => setFilterCategory(c)} className={`px-4 py-2 rounded-lg font-medium transition ${filterCategory === c ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>{c}</button>
          ))}
        </div>
      )}

      {isPending ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => <SkeletonLoader key={i} count={1} height="h-64" />)}
        </div>
      ) : error ? (
        <ErrorState message={(error as any)?.message || 'Failed to load team'} action={<button onClick={() => refetch()} className="text-sm text-blue-600 hover:underline">Retry</button>} />
      ) : filtered && filtered.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filtered.map((m: any) => (
            <TeamCard key={m.id} member={m} onDelete={handleDelete} onToggleFeatured={handleToggleFeatured} deletingId={deletingId} togglingId={togglingId} />
          ))}
        </div>
      ) : (
        <EmptyState icon={<Users className="w-12 h-12" />} title="No team members yet" description="Add your first team member." />
      )}
    </div>
  )
}

export default function TeamPage() {
  return (
    <ProtectedRoute requiredRole="editor">
      <ErrorBoundary>
        <TeamPageContent />
      </ErrorBoundary>
    </ProtectedRoute>
  )
}
