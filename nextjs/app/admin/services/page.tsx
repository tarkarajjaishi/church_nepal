'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'motion/react'
import { Plus, Edit, Trash2, Star } from 'lucide-react'
import { useServices } from '@/lib/hooks'
import { SkeletonLoader, ErrorState } from '@/components/LoadingStates'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import type { Service } from '@/lib/types'
import api from '@/lib/admin/api'

function ServicesTable({ services, onRefresh }: { services: Service[]; onRefresh: () => void }) {
  const [sortBy, setSortBy] = useState<'title' | 'category' | 'price'>('title')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const sortedServices = [...services].sort((a, b) => {
    switch (sortBy) {
      case 'title':
        return a.title.localeCompare(b.title)
      case 'category':
        return a.category.localeCompare(b.category)
      case 'price':
        return (a.price || 0) - (b.price || 0)
      default:
        return 0
    }
  })

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this service?')) return

    try {
      setDeletingId(id)
      await api.delete(`/services/${id}`)
      onRefresh()
    } catch (error) {
      console.error('Delete error:', error)
      alert('Failed to delete service')
    } finally {
      setDeletingId(null)
    }
  }

  const handleToggleFeatured = async (service: Service) => {
    try {
      setTogglingId(service.id)
      await api.patch(`/services/${service.id}`, {
        ...service,
        featured: !service.featured,
      })
      onRefresh()
    } catch (error) {
      console.error('Toggle error:', error)
      alert('Failed to update service')
    } finally {
      setTogglingId(null)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase cursor-pointer hover:bg-gray-100 transition"
                onClick={() => setSortBy('title')}
              >
                Title {sortBy === 'title' && '↓'}
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase cursor-pointer hover:bg-gray-100 transition"
                onClick={() => setSortBy('category')}
              >
                Category {sortBy === 'category' && '↓'}
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase cursor-pointer hover:bg-gray-100 transition"
                onClick={() => setSortBy('price')}
              >
                Price {sortBy === 'price' && '↓'}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Featured</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {sortedServices.map((service: Service) => (
              <motion.tr
                key={service.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="hover:bg-gray-50 transition"
              >
                <td className="px-6 py-4">
                  <div>
                    <p className="font-medium text-gray-900">{service.title}</p>
                    <p className="text-sm text-gray-600 line-clamp-1">{service.description}</p>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="inline-block px-3 py-1 bg-indigo-100 text-indigo-700 text-sm rounded-full">
                    {service.category}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-700 font-semibold">
                  {service.price ? `$${service.price.toFixed(2)}` : '—'}
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => handleToggleFeatured(service)}
                    disabled={togglingId === service.id}
                    className={`p-2 rounded-lg transition ${
                      service.featured
                        ? 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200'
                        : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                    } disabled:opacity-50`}
                    title={service.featured ? 'Unfeature service' : 'Feature service'}
                  >
                    <Star className={`w-4 h-4 ${service.featured ? 'fill-current' : ''}`} />
                  </button>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/admin/services/${service.id}`}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => handleDelete(service.id)}
                      disabled={deletingId === service.id}
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
      {sortedServices.length === 0 && (
        <div className="px-6 py-12 text-center">
          <p className="text-gray-600">No services found</p>
        </div>
      )}
    </div>
  )
}

function ServicesPageContent() {
  const { data: services, loading, error, refetch } = useServices()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState<string | null>(null)

  const categories = [...new Set((services ?? []).map((s: Service) => s.category))] as string[]

  const filteredServices = (services ?? []).filter((service: Service) => {
    const matchesSearch = service.title.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = !filterCategory || service.category === filterCategory
    return matchesSearch && matchesCategory
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Services</h1>
          <p className="text-gray-600 mt-2">Manage church services and offerings</p>
        </div>
        <Link
          href="/admin/services/new"
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium whitespace-nowrap"
        >
          <Plus className="w-5 h-5" />
          New Service
        </Link>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search services..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Category Filter */}
      {!loading && categories.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setFilterCategory(null)}
            className={`px-4 py-2 rounded-lg font-medium transition ${
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
              className={`px-4 py-2 rounded-lg font-medium transition ${
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

      {/* Content */}
      {loading ? (
        <SkeletonLoader count={5} height="h-20" />
      ) : error ? (
        <ErrorState message={(error as any)?.detail || 'Failed to load services'} />
      ) : filteredServices.length > 0 ? (
        <ServicesTable services={filteredServices} onRefresh={refetch} />
      ) : (
        <div className="bg-gray-50 rounded-lg border border-gray-200 px-6 py-12 text-center">
          <p className="text-gray-600 font-medium">
            {searchTerm || filterCategory ? 'No services match your filters' : 'No services yet'}
          </p>
        </div>
      )}
    </div>
  )
}

export default function ServicesPage() {
  return (
    <ProtectedRoute requiredRole="editor">
      <ErrorBoundary>
        <ServicesPageContent />
      </ErrorBoundary>
    </ProtectedRoute>
  )
}
