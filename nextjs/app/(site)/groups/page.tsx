'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Calendar, MapPin, Users, ArrowRight, Clock, X } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PageHero } from '@/components/site/PageHero'
import { EditableBlock } from '@/components/site/EditableBlock'
import { useContentBlock } from '@/lib/hooks'
import { Reveal } from '@/components/site/Reveal'
import api from '@/lib/api'

const categoryColors: Record<string, string> = {
  youth: 'bg-blue-100 text-blue-700',
  women: 'bg-pink-100 text-pink-700',
  men: 'bg-indigo-100 text-indigo-700',
  couples: 'bg-rose-100 text-rose-700',
  'young-adults': 'bg-violet-100 text-violet-700',
  seniors: 'bg-amber-100 text-amber-700',
  general: 'bg-gray-100 text-gray-700',
}

export default function GroupsPage() {
  const hero = useContentBlock('groups_hero')
  const [groups, setGroups] = useState<any[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [filters, setFilters] = useState<{
    day: string
    category: string
    location: string
    mapView: boolean
  }>({
    day: '',
    category: '',
    location: '',
    mapView: false
  })

  // Fetch groups with filters
  useEffect(() => {
    const fetchGroups = async () => {
      try {
        setLoading(true)
        const params = new URLSearchParams()
        if (filters.day) params.append('day', filters.day)
        if (filters.category) params.append('category', filters.category)
        if (filters.location) params.append('location', filters.location)
        
        const response = await api.get(`/groups?${params.toString()}`)
        // Handle paginated response
        const data = Array.isArray(response.data) ? response.data : response.data.data
        setGroups(data)
      } catch (error) {
        console.error('Error fetching groups:', error)
        setGroups([])
      } finally {
        setLoading(false)
      }
    }
    
    fetchGroups()
  }, [filters])

  const handleFilterChange = (type: keyof typeof filters, value: string) => {
    setFilters(prev => ({ ...prev, [type]: value }))
  }

  const toggleMapView = () => {
    setFilters(prev => ({ ...prev, mapView: !prev.mapView }))
  }

  return (
    <div>
      {/* Hero */}
      <EditableBlock block={hero}>
        <PageHero
          title={hero?.title || 'Our Small Groups'}
          subtitle={hero?.subtitle || 'Connect & Grow Together'}
          image={hero?.image || ''}
          crumb="Groups"
        />
      </EditableBlock>

      {/* Description */}
      {hero?.body && (
        <section className="py-12 bg-secondary/30">
          <div className="mx-auto max-w-3xl px-4 text-center">
            <p className="text-lg text-muted-foreground leading-relaxed">{hero.body}</p>
          </div>
        </section>
      )}

      {/* Filters */}
      <section className="mb-8 pb-4 border-b">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex flex-wrap gap-4 items-end mb-6">
            <div>
              <label className="text-sm font-medium mb-1 block">Meeting Day</label>
              <select
                value={filters.day}
                onChange={(e) => handleFilterChange('day', e.target.value)}
                className="border rounded px-3 py-2 w-full md:w-48"
              >
                <option value="">All Days</option>
                <option value="Sunday">Sunday</option>
                <option value="Monday">Monday</option>
                <option value="Tuesday">Tuesday</option>
                <option value="Wednesday">Wednesday</option>
                <option value="Thursday">Thursday</option>
                <option value="Friday">Friday</option>
                <option value="Saturday">Saturday</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Category</label>
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="border rounded px-3 py-2 w-full md:w-48"
              >
                <option value="">All Categories</option>
                <option value="youth">Youth</option>
                <option value="women">Women</option>
                <option value="men">Men</option>
                <option value="couples">Couples</option>
                <option value="young-adults">Young Adults</option>
                <option value="seniors">Seniors</option>
                <option value="general">General</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Location</label>
              <input
                type="text"
                value={filters.location}
                onChange={(e) => handleFilterChange('location', e.target.value)}
                placeholder="Search location..."
                className="border rounded px-3 py-2 w-full md:w-48"
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={toggleMapView}
                className={`flex items-center gap-2 px-3 py-2 border rounded ${filters.mapView ? 'bg-muted' : 'hover:bg-muted'}`}
              >
                {filters.mapView ? (
                  <>
                    <MapPin className="size-4" />
                    <span className="text-sm">List View</span>
                  </>
                ) : (
                  <>
                    <MapPin className="size-4" />
                    <span className="text-sm">Map View</span>
                  </>
                )}
              </button>
            </div>
          </div>
          
          {/* Clear filters button */}
          {(filters.day || filters.category || filters.location) && (
            <Button variant="outline" size="sm" onClick={() => {
              setFilters({ day: '', category: '', location: '', mapView: false })
            }}>
              Clear Filters
            </Button>
          )}
        </div>
      </section>

      {filters.mapView ? (
        // Map View
        <section className="py-20">
          <div className="mx-auto max-w-7xl px-4">
            <h2 className="text-2xl font-bold text-church-blue mb-6">Groups by Location</h2>
            {loading ? (
              <div className="grid md:grid-cols-2 gap-6">
                {[1, 2, 3, 4].map((i) => (
                  <Card key={i} className="p-6 animate-pulse">
                    <div className="flex items-center gap-4">
                      <div className="size-12 bg-muted rounded-full shrink-0" />
                      <div className="flex-1">
                        <div className="h-5 bg-muted rounded w-3/4 mb-2" />
                        <div className="h-4 bg-muted rounded w-1/2" />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : groups.length === 0 ? (
              <div className="text-center py-12">
                <MapPin className="size-12 text-muted-foreground/50 mx-auto mb-4" />
                <p className="text-muted-foreground">No groups found for the selected filters.</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {groups.map((group: any, i: number) => (
                  <Reveal key={group.id} delay={i * 0.06}>
                    <Link href={`/groups/${group.id}`} className="block">
                      <Card className="p-6 border-border/60 hover:shadow-xl transition-all">
                        <div className="flex items-start gap-4">
                          <div className="shrink-0">
                            <div
                              className="size-12 rounded-full flex items-center justify-center"
                              style={{ backgroundColor: 'var(--church-blue-soft, #eff6ff)' }}
                            >
                              <MapPin className="size-6 text-church-blue" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <h3 className="text-xl font-bold text-church-blue" style={{ fontFamily: 'var(--font-heading)' }}>
                                  {group.name}
                                </h3>
                                <p className="text-base text-muted-foreground mt-1 font-medium">
                                  {group.location || 'Online / TBA'}
                                </p>
                              </div>
                              {group.category && (
                                <span
                                  className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${categoryColors[group.category] || categoryColors.general}`}
                                >
                                  {group.category}
                                </span>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-4 mt-3 text-sm text-muted-foreground">
                              {group.meeting_day && (
                                <div className="flex items-center gap-1.5">
                                  <Calendar className="size-4 text-church-blue shrink-0" />
                                  <span>{group.meeting_day}{group.meeting_time && ` at ${group.meeting_time}`}</span>
                                </div>
                              )}
                              {group.max_members && (
                                <div className="flex items-center gap-1.5">
                                  <Users className="size-4 text-church-blue shrink-0" />
                                  <span>Up to {group.max_members} members</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </Card>
                    </Link>
                  </Reveal>
                ))}
              </div>
            )}
          </div>
        </section>
      ) : (
        // List View
        <section className="py-20">
          <div className="mx-auto max-w-7xl px-4">
            {loading ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="p-6 animate-pulse">
                    <div className="h-6 bg-muted rounded w-3/4 mb-4" />
                    <div className="h-4 bg-muted rounded w-full mb-2" />
                    <div className="h-4 bg-muted rounded w-2/3" />
                  </Card>
                ))}
              </div>
            ) : groups.length === 0 ? (
              <div className="text-center py-12">
                <Users className="size-12 text-muted-foreground/50 mx-auto mb-4" />
                <p className="text-muted-foreground">No groups match your filters. Try adjusting your search.</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {groups.map((group: any, i: number) => (
                  <Reveal key={group.id} delay={i * 0.06}>
                    <Card className="p-6 h-full border-border/60 hover:shadow-xl transition-all flex flex-col">
                      <div className="flex items-start justify-between mb-3">
                        <h3
                          className="text-xl font-bold text-church-blue"
                          style={{ fontFamily: 'var(--font-heading)' }}
                        >
                          {group.name}
                        </h3>
                        {group.category && (
                          <span
                            className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${
                              categoryColors[group.category] || categoryColors.general
                            }`}
                          >
                            {group.category}
                          </span>
                        )}
                      </div>

                      {group.description && (
                        <p className="text-muted-foreground leading-relaxed mb-4 line-clamp-2 flex-1">
                          {group.description}
                        </p>
                      )}

                      <div className="space-y-2 text-sm text-muted-foreground mt-auto">
                        {group.meeting_day && (
                          <div className="flex items-center gap-2">
                            <Calendar className="size-4 text-church-blue shrink-0" />
                            <span>
                              {group.meeting_day}
                              {group.meeting_time && ` at ${group.meeting_time}`}
                            </span>
                          </div>
                        )}
                        {group.location && (
                          <div className="flex items-center gap-2">
                            <MapPin className="size-4 text-church-blue shrink-0" />
                            <span>{group.location}</span>
                          </div>
                        )}
                        {group.max_members && (
                          <div className="flex items-center gap-2">
                            <Users className="size-4 text-church-blue shrink-0" />
                            <span>Up to {group.max_members} members</span>
                          </div>
                        )}
                      </div>

<Link
  href={`/groups/${group.id}`}
  className="mt-4 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-church-blue text-white hover:bg-church-blue/90 transition-colors text-sm font-medium"
>
  View Details <ArrowRight className="size-4" />
</Link>
                    </Card>
                  </Reveal>
                ))}
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  )
}