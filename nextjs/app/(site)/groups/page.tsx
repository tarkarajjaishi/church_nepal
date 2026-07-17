'use client'

import Link from 'next/link'
import { Calendar, MapPin, Users, ArrowRight, Clock } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PageHero } from '@/components/site/PageHero'
import { EditableBlock } from '@/components/site/EditableBlock'
import { useContentBlock, useEnabledGroups } from '@/lib/hooks'
import { Reveal } from '@/components/site/Reveal'

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
  const { data: groups = [], loading } = useEnabledGroups()

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

      {/* Groups Grid */}
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
              <p className="text-muted-foreground">No groups available at this time. Check back soon!</p>
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
                      href={`/contact?group=${encodeURIComponent(group.name)}`}
                      className="mt-4 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-church-blue text-white hover:bg-church-blue/90 transition-colors text-sm font-medium"
                    >
                      Join This Group <ArrowRight className="size-4" />
                    </Link>
                  </Card>
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
