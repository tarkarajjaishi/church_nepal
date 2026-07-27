'use client'

import { useQuery } from '@tanstack/react-query'
import api, { PaginatedResponse } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { PageHero } from '@/components/site/PageHero'
import { Reveal } from '@/components/site/Reveal'
import Link from 'next/link'
import { images } from '@/lib/data'

export interface Campaign {
  id: string
  title: string
  raised: number
  goal: number
  enabled?: boolean
}

function ProgressBar({ raised, goal }: { raised: number; goal: number }) {
  const pct = Math.round((raised / goal) * 100)
  return (
    <div className="space-y-1">
      <Progress value={pct} className="h-2" />
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>Rs {raised.toLocaleString()} raised</span>
        <span>Rs {goal.toLocaleString()} goal</span>
      </div>
    </div>
  )
}

export default function CampaignsPage() {
  const { data: campaigns = [], isLoading } = useQuery({
    queryKey: ['campaigns'],
    queryFn: () => api.get<PaginatedResponse<Campaign>>('/campaigns').then(r => (r.data as any).data ?? r.data),
  })

  const enabled = (campaigns as any[]).filter((c: any) => c.enabled !== false)

  return (
    <div>
      <PageHero
        title="Campaigns"
        crumb="Campaigns"
        image={images.worship1}
        subtitle="Support these fundraising initiatives and help us reach our goals."
      />

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2, 3].map(i => (
                <Card key={i} className="h-48 animate-pulse bg-muted" />
              ))}
            </div>
          ) : enabled.length === 0 ? (
            <div className="text-center text-muted-foreground">No active campaigns at the moment.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {enabled.map((c: any) => {
                const pct = Math.round((c.raised / c.goal) * 100)
                return (
                  <Reveal key={c.id}>
                    <Card className="h-full border-border/60 hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex items-start justify-between gap-3">
                          <CardTitle className="text-lg text-[#0b3c5d]" style={{ fontFamily: "var(--font-heading)", fontWeight: 600 }}>
                            {c.title}
                          </CardTitle>
                          <span className="text-sm font-semibold text-gold">{pct}%</span>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <ProgressBar raised={c.raised} goal={c.goal} />
                        <Link
                          href={`/campaigns/${c.id}`}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-church-blue text-white text-sm hover:bg-church-blue/90 transition-colors"
                        >
                          View details
                        </Link>
                      </CardContent>
                    </Card>
                  </Reveal>
                )
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
