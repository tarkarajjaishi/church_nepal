'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'motion/react'
import { Plus, Edit, Trash2, Star, ExternalLink, Search } from 'lucide-react'
import { usePortfolio } from '@/lib/hooks'
import { SkeletonLoader, ErrorState, EmptyState } from '@/components/LoadingStates'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import type { PortfolioProject } from '@/lib/types'
import api from '@/lib/admin/api'

/**
 * ProjectCard - Individual portfolio project card with image, metadata, and actions
 */
function ProjectCard({
  project,
  onDelete,
  onToggleFeatured,
  deletingId,
  togglingId,
}: {
  project: PortfolioProject
  onDelete: (id: string) => void
  onToggleFeatured: (project: PortfolioProject) => void
  deletingId: string | null
  togglingId: string | null
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="bg-white rounded-lg shadow-md hover:shadow-lg transition overflow-hidden group"
    >
      {/* Project Image Section */}
      <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
        {project.image ? (
          <img
            src={project.image}
            alt={project.title}
            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-gray-400 text-sm font-medium">No Image</span>
          </div>
        )}

        {/* Featured Badge */}
        {project.featured && (
          <div className="absolute top-3 right-3 bg-yellow-400 text-yellow-900 px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-md">
            <Star className="w-3.5 h-3.5 fill-current" />
            Featured
          </div>
        )}
      </div>

      {/* Card Content */}
      <div className="p-4 space-y-3">
        {/* Title and Category */}
        <div>
          <h3 className="font-semibold text-gray-900 line-clamp-2 mb-2">{project.title}</h3>
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="inline-block px-2.5 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
              {project.category}
            </span>
            {project.year && (
              <span className="text-xs text-gray-500 font-medium bg-gray-100 px-2 py-1 rounded">
                {project.year}
              </span>
            )}
          </div>
        </div>

        {/* Description */}
        {project.description && (
          <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">{project.description}</p>
        )}

        {/* Client Info */}
        <div className="pt-2 border-t border-gray-100">
          <p className="text-xs text-gray-600">
            <span className="font-medium text-gray-700">Client:</span> {project.client || 'N/A'}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 pt-3 border-t border-gray-100">
          <button
            onClick={() => onToggleFeatured(project)}
            disabled={togglingId === project.id}
            className={`flex-1 p-2 rounded-lg transition flex items-center justify-center gap-1 text-xs font-medium ${
              project.featured
                ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
            title={project.featured ? 'Unfeature project' : 'Feature project'}
          >
            <Star className={`w-3.5 h-3.5 ${project.featured ? 'fill-current' : ''}`} />
            <span className="hidden sm:inline">{project.featured ? 'Featured' : 'Feature'}</span>
          </button>

          <Link
            href={`/admin/portfolio/${project.id}`}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
            title="Edit project"
          >
            <Edit className="w-4 h-4" />
          </Link>

          <button
            onClick={() => onDelete(project.id)}
            disabled={deletingId === project.id}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            title="Delete project"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          {project.url && (
            <a
              href={project.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
              title="View live project"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </div>
      </div>
    </motion.div>
  )
}

/**
 * ProjectsGrid - Displays projects in responsive grid layout
 */
function ProjectsGrid({
  projects,
  onRefresh,
}: {
  projects: PortfolioProject[]
  onRefresh: () => void
}) {
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this project? This cannot be undone.')) return

    try {
      setDeletingId(id)
      await api.delete(`/portfolio/${id}`)
      onRefresh()
    } catch (error) {
      console.error('Delete error:', error)
      alert('Failed to delete project')
    } finally {
      setDeletingId(null)
    }
  }

  const handleToggleFeatured = async (project: PortfolioProject) => {
    try {
      setTogglingId(project.id)
      await api.patch(`/portfolio/${project.id}`, {
        ...project,
        featured: !project.featured,
      })
      onRefresh()
    } catch (error) {
      console.error('Toggle featured error:', error)
      alert('Failed to update project')
    } finally {
      setTogglingId(null)
    }
  }

  if (projects.length === 0) {
    return (
      <div className="bg-gray-50 rounded-lg border border-gray-200 p-12 text-center">
        <p className="text-gray-600 font-medium">No portfolio projects found</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {projects.map((project) => (
        <ProjectCard
          key={project.id}
          project={project}
          onDelete={handleDelete}
          onToggleFeatured={handleToggleFeatured}
          deletingId={deletingId}
          togglingId={togglingId}
        />
      ))}
    </div>
  )
}

/**
 * SkeletonGrid - Loading skeleton matching grid layout
 */
function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="h-48 bg-gray-200 animate-pulse" />
          <div className="p-4 space-y-3">
            <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3" />
            <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2" />
            <div className="h-3 bg-gray-200 rounded animate-pulse" />
            <div className="pt-2 border-t border-gray-100">
              <div className="h-3 bg-gray-200 rounded animate-pulse w-3/4" />
            </div>
            <div className="flex gap-1.5 pt-3 border-t border-gray-100">
              <div className="flex-1 h-8 bg-gray-200 rounded animate-pulse" />
              <div className="w-8 h-8 bg-gray-200 rounded animate-pulse" />
              <div className="w-8 h-8 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

/**
 * PortfolioPageContent - Main portfolio management page content
 */
function PortfolioPageContent() {
  const { data: projects, loading, error, refetch } = usePortfolio()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState<string | null>(null)
  const [filterFeatured, setFilterFeatured] = useState<'all' | 'featured' | 'unfeatured'>('all')

  const categories = [...new Set((projects ?? []).map((p: PortfolioProject) => p.category))].filter(Boolean) as string[]

  const filteredProjects = (projects ?? []).filter((project: PortfolioProject) => {
    const matchesSearch =
      project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.category.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesCategory = !filterCategory || project.category === filterCategory

    const matchesFeatured =
      filterFeatured === 'all' ||
      (filterFeatured === 'featured' && project.featured) ||
      (filterFeatured === 'unfeatured' && !project.featured)

    return matchesSearch && matchesCategory && matchesFeatured
  })

  const featuredCount = (projects ?? []).filter((p: PortfolioProject) => p.featured).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Portfolio</h1>
          <p className="text-gray-600 mt-2">Manage your portfolio projects and work samples</p>
        </div>
        <Link
          href="/admin/portfolio/new"
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium whitespace-nowrap"
        >
          <Plus className="w-5 h-5" />
          New Project
        </Link>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
        <input
          type="text"
          placeholder="Search by title, client, or category..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
        />
      </div>

      {/* Filters */}
      {!loading && (categories.length > 0 || (projects ?? []).length > 0) && (
        <div className="space-y-3">
          {/* Category Filter */}
          {categories.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setFilterCategory(null)}
                className={`px-4 py-2 rounded-lg font-medium transition text-sm ${
                  filterCategory === null
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All Categories
              </button>
              {categories.map((cat: string) => (
                <button
                  key={cat}
                  onClick={() => setFilterCategory(cat)}
                  className={`px-4 py-2 rounded-lg font-medium transition text-sm ${
                    filterCategory === cat
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}

          {/* Featured Filter */}
          <div className="flex gap-2 flex-wrap">
            {(['all', 'featured', 'unfeatured'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilterFeatured(status)}
                className={`px-4 py-2 rounded-lg font-medium transition text-sm capitalize ${
                  filterFeatured === status
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status === 'all' ? 'All Status' : status}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Stats Cards */}
      {!loading && (projects ?? []).length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-600 font-medium">Total Projects</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{projects?.length || 0}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-600 font-medium">Featured</p>
            <p className="text-2xl font-bold text-yellow-600 mt-1">{featuredCount}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-600 font-medium">Categories</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">{categories.length}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-600 font-medium">Results</p>
            <p className="text-2xl font-bold text-indigo-600 mt-1">{filteredProjects.length}</p>
          </div>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <SkeletonGrid />
      ) : error ? (
        <ErrorState
          message={(error as any)?.detail || 'Failed to load portfolio projects'}
          action={
            <button
              onClick={() => refetch()}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium text-sm"
            >
              Try Again
            </button>
          }
        />
      ) : filteredProjects.length > 0 ? (
        <ProjectsGrid projects={filteredProjects} onRefresh={refetch} />
      ) : (
        <EmptyState
          icon={<Plus className="w-12 h-12" />}
          title={searchTerm || filterCategory || filterFeatured !== 'all' ? 'No projects match' : 'No projects yet'}
          description={
            searchTerm || filterCategory || filterFeatured !== 'all'
              ? 'Try adjusting your search or filters'
              : 'Get started by creating your first portfolio project'
          }
          action={
            <Link
              href="/admin/portfolio/new"
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium inline-flex items-center gap-2 text-sm"
            >
              <Plus className="w-4 h-4" />
              New Project
            </Link>
          }
        />
      )}
    </div>
  )
}

/**
 * PortfolioPage - Main page component with error boundary and protected route
 */
export default function PortfolioPage() {
  return (
    <ProtectedRoute requiredRole="editor">
      <ErrorBoundary>
        <PortfolioPageContent />
      </ErrorBoundary>
    </ProtectedRoute>
  )
}
