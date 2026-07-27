'use client'

import { useState, useEffect } from 'react'
import { Calendar, MapPin, Users, ArrowRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import api from '@/lib/portal/api'

interface Group {
  id: number
  name: string
  description?: string
  meetingDay?: string
  meetingTime?: string
  location?: string
  category?: string
  imageUrl?: string
  maxMembers?: number
}

export default function PortalGroupsPage() {
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchGroups = async () => {
      setLoading(true)
      try {
        const res = await api.get('/portal/groups')
        setGroups(res.data)
      } catch (err) {
        console.error('Failed to load groups', err)
      } finally {
        setLoading(false)
      }
    }
    fetchGroups()
  }, [])

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold text-church-blue">My Groups</h1>

      {groups.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Users className="size-12 text-muted-foreground/50 mx-auto mb-4" />
            <p className="text-muted-foreground">You are not currently part of any small groups.</p>
            <p className="text-sm text-muted-foreground mt-2">
              Check out our groups page to find one that fits you!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {groups.map((group) => (
            <Card key={group.id} className="border-border/60">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-church-blue mb-2">{group.name}</h3>
                {group.description && (
                  <p className="text-sm text-muted-foreground mb-3">{group.description}</p>
                )}
                <div className="space-y-1.5 text-sm text-muted-foreground">
                  {group.meetingDay && (
                    <div className="flex items-center gap-2">
                      <Calendar className="size-4 text-church-blue shrink-0" />
                      <span>
                        {group.meetingDay}
                        {group.meetingTime && ` at ${group.meetingTime}`}
                      </span>
                    </div>
                  )}
                  {group.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="size-4 text-church-blue shrink-0" />
                      <span>{group.location}</span>
                    </div>
                  )}
                  {group.maxMembers && (
                    <div className="flex items-center gap-2">
                      <Users className="size-4 text-church-blue shrink-0" />
                      <span>Up to {group.maxMembers} members</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
