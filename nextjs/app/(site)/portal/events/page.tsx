'use client'

import { useState, useEffect } from 'react'
import { Calendar, MapPin, X, Clock } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import api from '@/lib/portal/api'

interface EventRsvp {
  id: string
  eventId: string
  name: string
  email: string
  phone: string
  guests: number
  status: string
  createdAt: string
  eventTitle?: string
  eventDate?: string
  eventTime?: string
  eventLocation?: string
}

export default function PortalEventsPage() {
  const [rsvps, setRsvps] = useState<EventRsvp[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRsvps()
  }, [])

  const fetchRsvps = async () => {
    setLoading(true)
    try {
      const res = await api.get('/portal/rsvps')
      setRsvps(res.data)
    } catch (err) {
      console.error('Failed to load RSVPs', err)
    } finally {
      setLoading(false)
    }
  }

  const cancelRsvp = async (rsvpId: string) => {
    try {
      await api.delete(`/portal/rsvps/${rsvpId}`)
      setRsvps((prev) => prev.filter((r) => r.id !== rsvpId))
    } catch (err) {
      console.error('Failed to cancel RSVP', err)
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold text-church-blue">My Event Registrations</h1>

      {rsvps.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Calendar className="size-12 text-muted-foreground/50 mx-auto mb-4" />
            <p className="text-muted-foreground">You haven't registered for any events yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {rsvps.map((rsvp) => (
            <Card key={rsvp.id} className="border-border/60">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-church-blue">
                      {rsvp.eventTitle || 'Event'}
                    </h3>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      {rsvp.eventDate && (
                        <div className="flex items-center gap-2">
                          <Calendar className="size-4 text-gold" />
                          <span>{new Date(rsvp.eventDate).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}</span>
                        </div>
                      )}
                      {rsvp.eventTime && (
                        <div className="flex items-center gap-2">
                          <Clock className="size-4 text-gold" />
                          <span>{rsvp.eventTime}</span>
                        </div>
                      )}
                      {rsvp.eventLocation && (
                        <div className="flex items-center gap-2">
                          <MapPin className="size-4 text-gold" />
                          <span>{rsvp.eventLocation}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <span className="text-xs">
                          Guests: {rsvp.guests} · Status: <span className="capitalize">{rsvp.status}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => cancelRsvp(rsvp.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <X className="size-4 mr-1" />
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
