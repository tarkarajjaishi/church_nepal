'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'motion/react'
import { Plus, Edit, Trash2, Eye, EyeOff } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useBlogPosts } from '@/lib/hooks'
import api from '@/lib/admin/api'
import { SkeletonLoader, ErrorState } from '@/components/LoadingStates'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { toast } from 'sonner'
import type { BlogPost } from '@/lib/types'

function BlogTable({ posts }: { posts: BlogPost[] }) {
  const queryClient = useQueryClient()
  const [sortBy, setSortBy] = useState<'title' | 'author' | 'date'>('date')

  const deleteMut = useMutation({
    mutationFn: (id: string) => api.delete(`/blog/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blog'] })
      toast.success('Post deleted')
    },
    onError: () => toast.error('Failed to delete post'),
  })

  const sortedPosts = [...posts].sort((a, b) => {
    switch (sortBy) {
      case 'title':  return a.title.localeCompare(b.title)
      case 'author': return (a.author || '').localeCompare(b.author || '')
      case 'date':
        // camelCase from API interceptor: createdAt (not created_at)
        return new Date((b as any).createdAt || '').getTime() - new Date((a as any).createdAt || '').getTime()
    }
  })

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase cursor-pointer hover:bg-gray-100"
                onClick={() => setSortBy('title')}>
                Title {sortBy === 'title' && '↓'}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase cursor-pointer hover:bg-gray-100"
                onClick={() => setSortBy('author')}>
                Author {sortBy === 'author' && '↓'}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {sortedPosts.map((post: BlogPost) => (
              <motion.tr key={post.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="hover:bg-gray-50 transition">
                <td className="px-6 py-4">
                  <div>
                    <p className="font-medium text-gray-900">{post.title}</p>
                    <p className="text-sm text-gray-600">{post.slug}</p>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-700">{post.author || '—'}</td>
                <td className="px-6 py-4">
                  <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full">
                    {post.category || 'Uncategorized'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    {post.published ? (
                      <span className="flex items-center gap-1 text-green-600 text-sm">
                        <Eye className="w-4 h-4" /> Published
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-gray-600 text-sm">
                        <EyeOff className="w-4 h-4" /> Draft
                      </span>
                    )}
                    {post.featured && <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded font-medium">Featured</span>}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <Link href={`/admin/blog/${post.id}`} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition" title="Edit">
                      <Edit className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => { if (confirm('Delete this post?')) deleteMut.mutate(post.id) }}
                      disabled={deleteMut.isPending}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
      {sortedPosts.length === 0 && <div className="px-6 py-12 text-center"><p className="text-gray-600">No blog posts yet</p></div>}
    </div>
  )
}

function BlogPageContent() {
  const { data: posts, loading, error } = useBlogPosts()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Blog Posts</h1>
          <p className="text-gray-600 mt-2">Manage church blog posts and articles</p>
        </div>
        <Link href="/admin/blog/new" className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium">
          <Plus className="w-5 h-5" />
          New Post
        </Link>
      </div>

      {loading ? <SkeletonLoader count={5} height="h-20" /> : error ? <ErrorState message={(error as any)?.detail || 'Failed to load blog posts'} /> : posts ? <BlogTable posts={posts} /> : null}
    </div>
  )
}

export default function BlogPage() {
  return (
    <ProtectedRoute requiredRole="editor">
      <ErrorBoundary>
        <BlogPageContent />
      </ErrorBoundary>
    </ProtectedRoute>
  )
}
