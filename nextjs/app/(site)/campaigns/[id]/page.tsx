'use client'

import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { PageHero } from '@/components/site/PageHero'
import { Reveal } from '@/components/site/Reveal'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { images } from '@/lib/data'

export interface Campaign {
  id: string
  title: string
  raised: number
  goal: number
  enabled?: boolean
}

export interface CampaignStats {
  pledge_amount: number
  pledge_count: number
  donation_amount: number
  donation_count: number
  raised: number
  goal: number
  total_toward_goal: number
  progress_percent: number
}

export default function CampaignDetailPage() {
  const params = useParams()
  const id = params.id as string

  const { data: campaign, isLoading: campaignLoading } = useQuery({
    queryKey: ['campaign', id],
    queryFn: () => api.get<Campaign>(`/campaigns/${id}`).then(r => r.data),
    enabled: !!id,
  })

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['campaign-stats', id],
    queryFn: () => api.get<CampaignStats>(`/campaigns/${id}/stats`).then(r => r.data),
    enabled: !!id,
  })

  if (campaignLoading) {
    return (
      <div className="py-16">
        <div className="mx-auto max-w-3xl px-4">
          <Card className="h-48 animate-pulse bg-muted" />
        </div>
      </div>
    )
  }

  if (!campaign) {
    return (
      <div className="py-16 text-center">
        <p className="text-muted-foreground">Campaign not found.</p>
        <Link href="/campaigns" className="text-church-blue underline mt-2 inline-block">View all campaigns</Link>
      </div>
    )
  }

  const pct = stats ? Math.round(stats.progress_percent) : Math.round((campaign.raised / campaign.goal) * 100)
  const donationAmount = stats?.donation_amount ?? 0
  const pledgeAmount = stats?.pledge_amount ?? 0

  return (
    <div>
      <PageHero
        title={campaign.title}
        crumb="Campaigns"
        image={images.worship1}
        subtitle="Help us reach this goal through your generous giving."
      />

      <section className="py-16">
        <div className="mx-auto max-w-3xl px-4">
          <Reveal>
            <Card className="border-border/60">
              <CardHeader>
                <CardTitle className="text-xl text-[#0b3c5d]" style={{ fontFamily: "var(--font-heading)", fontWeight: 700 }}>
                  Fundraising Progress
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Main progress */}
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Total toward goal</span>
                    <span className="font-bold text-church-blue">{pct}%</span>
                  </div>
                  <Progress value={pct} className="h-3" />
                  <div className="flex justify-between text-sm text-muted-foreground mt-2">
                    <span>Rs {campaign.raised.toLocaleString()} raised</span>
                    <span>Rs {campaign.goal.toLocaleString()} goal</span>
                  </div>
                </div>

                {/* Breakdown */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-green-50 border border-green-100">
                    <div className="text-sm font-medium text-green-700 mb-1">Donations Received</div>
                    <div className="text-2xl font-bold text-green-900">Rs {donationAmount.toLocaleString()}</div>
                    <div className="text-xs text-green-700 mt-1">{stats?.donation_count ?? 0} payments</div>
                  </div>
                  <div className="p-4 rounded-xl bg-blue-50 border border-blue-100">
                    <div className="text-sm font-medium text-blue-700 mb-1">Pledges Committed</div>
                    <div className="text-2xl font-bold text-blue-900">Rs {pledgeAmount.toLocaleString()}</div>
                    <div className="text-xs text-blue-700 mt-1">{stats?.pledge_count ?? 0} commitments</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Link
                    href="/give"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gold text-church-blue font-medium hover:bg-gold/90 transition-colors"
                  >
                    Give to this campaign
                  </Link>
                  <Link
                    href="/campaigns"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-church-blue text-church-blue hover:bg-church-blue/5 transition-colors"
                  >
                    All campaigns
                  </Link>
                </div>
              </CardContent>
            </Card>
          </Reveal>
        </div>
      </section>
    </div>
  )
}
