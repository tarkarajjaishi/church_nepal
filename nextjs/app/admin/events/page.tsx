'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'motion/react'
import { Plus, Edit, Trash2, Calendar, MapPin } from 'lucide-react'
import { useEvents } from '@/lib/hooks'
import { SkeletonLoader, ErrorState } from '@/components/LoadingStates'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import type { ChurchEvent } from '@/lib/data'

function EventCard({ event }: { event: ChurchEvent }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow hover:shadow-lg transition p-6"
    >
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900">{event.title}</h3>
          <p className="text-sm text-gray-600 mt-1 line-clamp-2">{event.description || ''}</p>
        </div>

        <div className="space-y-2 text-sm text-gray-700">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span>{event.displayDate}</span>
            {event.time && <span>at {event.time}</span>}
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-gray-400" />
            <span>{event.location}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-4 border-t border-gray-200">
          <Link
            href={`/admin/events/${event.id}`}
            className="flex-1 py-2 px-3 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition font-medium text-sm flex items-center justify-center gap-2"
          >
            <Edit className="w-4 h-4" />
            Edit
          </Link>
          <button className="py-2 px-3 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition font-medium text-sm flex items-center gap-2">
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      </div>
    </motion.div>
  )
}

function EventsPageContent() {
  const { data: events, isPending, error } = useEvents()
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('upcoming')

  const filteredEvents = (events ?? []).filter((event: ChurchEvent) => {
    if (filter === 'all') return true
    const eventDate = new Date(event.date)
    const today = new Date()
    return filter === 'upcoming' ? eventDate >= today : eventDate < today
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Events</h1>
          <p className="text-gray-600 mt-2">Manage church events and gatherings</p>
        </div>
        <Link
          href="/admin/events/new"
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
        >
          <Plus className="w-5 h-5" />
          New Event
        </Link>
      </div>

      <div className="flex gap-2">
        {(['all', 'upcoming', 'past'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === f
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {isPending ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <SkeletonLoader key={i} count={1} height="h-48" />
          ))}
        </div>
      ) : error ? (
        <ErrorState message={(error as any)?.detail || 'Failed to load events'} />
      ) : filteredEvents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((event: ChurchEvent) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600 font-medium">No {filter} events</p>
        </div>
      )}
    </div>
  )
}

export default function EventsPage() {
  return (
    <ProtectedRoute requiredRole="editor">
      <ErrorBoundary>
        <EventsPageContent />
      </ErrorBoundary>
    </ProtectedRoute>
  )
}
