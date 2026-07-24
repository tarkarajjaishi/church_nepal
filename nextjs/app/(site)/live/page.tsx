'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Radio, Users, Send, Calendar } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { PageHero } from '@/components/site/PageHero'
import { EditableBlock } from '@/components/site/EditableBlock'
import { Reveal } from '@/components/site/Reveal'
import { useServiceTimes, useContentBlock } from '@/lib/hooks'
import { useSetting } from '@/lib/hooks/settings'
import { images } from '@/lib/data'

interface ChatMessage {
  id: string
  name: string
  text: string
}

const FALLBACK_CHAT: ChatMessage[] = [
  { id: 'c1', name: 'Sunita', text: 'Praise God! Worshipping from Pokhara 🙏' },
  { id: 'c2', name: 'Ramesh', text: 'Amen! Powerful message today.' },
  { id: 'c3', name: 'Kabita', text: 'Blessings to everyone joining online ❤️' },
]

export default function Live() {
  const { data: serviceTimes = [] } = useServiceTimes()

  const heroBlock = useContentBlock('live_hero')
  const streamBlock = useContentBlock('live_stream')
  const chatHeadingBlock = useContentBlock('live_chat_heading')
  const chatMessagesBlock = useContentBlock('live_chat_messages')
  const scheduleBlock = useContentBlock('live_schedule')

  const heroItems = heroBlock?.items?.[0] || {}
  const streamItems = streamBlock?.items?.[0] || {}
  const chatHeadingItems = chatHeadingBlock?.items?.[0] || {}
  const scheduleItems = scheduleBlock?.items?.[0] || {}

  const initialMessages: ChatMessage[] = Array.isArray(chatMessagesBlock?.items)
    ? chatMessagesBlock.items.map((m: any, i: number) => ({ id: `cm${i}`, name: m.name || 'Guest', text: m.text || '' }))
    : FALLBACK_CHAT

  const [chat, setChat] = useState<ChatMessage[]>(initialMessages)
  const [message, setMessage] = useState('')
  const [viewers, setViewers] = useState(342)

  // Settings for live stream and chat
  const liveStreamUrlQuery = useSetting('live_stream_url')
  const liveChatEnabledQuery = useSetting('live_chat_enabled')
  const liveStreamUrl = liveStreamUrlQuery.data?.value?.trim() ?? ''
  const liveChatEnabled = liveChatEnabledQuery.data?.value === 'true'

  // Determine if we are live (based on presence of stream URL)
  const isLive = !!liveStreamUrl

  // Determine platform from URL
  const getPlatform = (url: string) => {
    const lower = url.toLowerCase()
    if (lower.includes('youtube.com') || lower.includes('youtu.be')) return 'youtube'
    if (lower.includes('facebook.com') || lower.includes('fb.watch')) return 'facebook'
    return 'unknown'
  }
  const platform = liveStreamUrl ? getPlatform(liveStreamUrl) : 'unknown'

  // Extract YouTube video ID from various URL formats
  const getYouTubeId = (url: string) => {
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*)/
    const match = url.match(regExp)
    return match && match[7].length === 11 ? match[7] : null
  }

  // Extract Facebook video ID from URL (simplified)
  const getFacebookVideoId = (url: string) => {
    // Match numeric video ID in various FB URL formats
    const match = url.match(/\/videos\/(\d+)\/|\/videos\/(?:.+?\/)?(\d+)\/|\/video\.php\?v=(\d+)/)
    return match ? (match[1] || match[2] || match[3]) : null
  }

  // Function to compute next service time and countdown
  const getNextService = (serviceTimes: any[]) => {
    if (serviceTimes.length === 0) return { nextService: null, nextStart: null }

    const now = new Date()
    let nextService = null
    let nextStart: Date | null = null

    for (const service of serviceTimes) {
      // Parse day string (e.g., "Sunday") to day index (0-6)
      const dayMap: Record<string, number> = {
        sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6
      }
      const dayStr = service.day.toLowerCase()
      const targetDay = dayMap[dayStr]
      if (targetDay === undefined) continue

      // Parse time string (e.g., "10:00 AM")
      const timeMatch = service.time.match(/(\d+):(\d+)\s*(AM|PM)/i)
      if (!timeMatch) continue
      let hours = parseInt(timeMatch[1], 10)
      const minutes = parseInt(timeMatch[2], 10)
      const ampm = timeMatch[3].toUpperCase()
      if (ampm === 'PM' && hours !== 12) hours += 12
      if (ampm === 'AM' && hours === 12) hours = 0

      // Build date for this coming week
      const targetDate = new Date(now)
      targetDate.setHours(hours, minutes, 0, 0)
      const dayDiff = (targetDay - targetDate.getDay() + 7) % 7
      if (dayDiff === 0) {
        // Same day: check if time has passed
        if (targetDate <= now) {
          // Already passed today, try next week
          targetDate.setDate(targetDate.getDate() + 7)
        }
      } else {
        targetDate.setDate(targetDate.getDate() + dayDiff)
      }

      if (!nextStart || targetDate < nextStart) {
        nextStart = targetDate
        nextService = { ...service, start: targetDate }
      }
    }

    return { nextService, nextStart }
  }

  const { nextService, nextStart } = getNextService(serviceTimes)

  // Countdown state
  const [timeLeft, setTimeLeft] = useState<string>('')
  const countdownRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!isLive && nextStart) {
      const updateCountdown = () => {
        const now = new Date()
        const diff = nextStart.getTime() - now.getTime()
        if (diff <= 0) {
          setTimeLeft('Live now!')
          // Optionally reload to show live stream
          // if (typeof window !== 'undefined') window.location.reload()
        } else {
          const hours = Math.floor(diff / (1000 * 60 * 60))
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
          const seconds = Math.floor((diff % (1000 * 60)) / 1000)
          setTimeLeft(
            `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
          )
        }
      }

      updateCountdown() // initial call
      countdownRef.current = setInterval(updateCountdown, 1000)
      return () => {
        if (countdownRef.current) clearInterval(countdownRef.current)
      }
    } else {
      setTimeLeft('')
      if (countdownRef.current) clearInterval(countdownRef.current)
    }
  }, [isLive, nextStart])

  function sendMessage(e: React.FormEvent) {
    e.preventDefault()
    const text = message.trim()
    if (!text) return
    setChat((prev) => [...prev, { id: `c${Date.now()}`, name: 'You', text }])
    setMessage('')
    setViewers((v) => v + 1)
  }

  // Get YouTube live chat iframe URL with proper embed domain
  const getYouTubeChatUrl = (videoId: string) => {
    const embedDomain =
      typeof window !== 'undefined' ? window.location.hostname : 'localhost'
    return `https://www.youtube.com/live_chat?v=${videoId}&is_popout=1&embed_domain=${encodeURIComponent(
      embedDomain
    )}`
  }

  return (
    <div>
      <EditableBlock block={heroBlock}>
        <PageHero
          title={heroBlock?.title || 'Join Us Live'}
          crumb={heroItems.eyebrow || 'Live Stream'}
          image={heroBlock?.image || images.band}
          subtitle={heroBlock?.subtitle || "Can't be with us in person? Worship along with our congregation from anywhere in the world."}
        />
      </EditableBlock>

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 grid lg:grid-cols-3 gap-8">
          {/* Stream Column */}
          <EditableBlock block={streamBlock}>
            <Reveal className="lg:col-span-2">
              <Card className="overflow-hidden border-border/60">
                {isLive ? (
                  <>
                    {/* Video embed */}
                    <div className="relative aspect-video bg-church-blue grid place-items-center">
                      {platform === 'youtube' ? (
                        <iframe
                          className="absolute inset-0 w-full h-full"
                          src={`https://www.youtube.com/embed/${getYouTubeId(liveStreamUrl)}?autoplay=1&rel=0`}
                          title={streamBlock?.title || 'Live Stream'}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      ) : platform === 'facebook' ? (
                        <iframe
                          className="absolute inset-0 w-full h-full"
                          src={`https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(
                            liveStreamUrl
                          )}&show_text=0&width=560`}
                          title={streamBlock?.title || 'Live Stream'}
                          allow="autoplay; clipboard-write; encrypted-media; picture-in-picture"
                          allowFullScreen
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-white/80">
                          <p>Live stream URL not recognized. Please check the settings.</p>
                        </div>
                      )}
                    </div>

                    {/* Optional chat embed (below video) */}
                    {liveChatEnabled && platform !== 'unknown' && (
                      <div className="mt-4">
                        <h3 className="text-church-blue mb-2" style={{ fontFamily: 'var(--font-heading)', fontWeight: 600 }}>
                          Live Chat
                        </h3>
                        {platform === 'youtube' ? (
                          <iframe
                            className="w-full h-96 border-0 rounded-lg"
                            src={getYouTubeChatUrl(getYouTubeId(liveStreamUrl) ?? '')}
                            title="Live Chat"
                            allow="autoplay; clipboard-write; encrypted-media; picture-in-picture"
                            style={{ borderRadius: '4px' }}
                          />
                        ) : platform === 'facebook' ? (
                          <iframe
                            className="w-full h-96 border-0 rounded-lg"
                            src={`https://www.facebook.com/plugins/comments.php?href=${encodeURIComponent(
                              liveStreamUrl
                            )}&width=500&numposts=5`}
                            title="Facebook Comments"
                            allow="autoplay; clipboard-write; encrypted-media; picture-in-picture"
                            style={{ borderRadius: '4px' }}
                          />
                        ) : null}
                      </div>
                    )}
                  </>
                ) : (
                  {/* Offline state: show schedule and countdown */}
                  <>
                    <div className="relative aspect-video bg-church-blue grid place-items-center">
                      <img
                        src={streamBlock?.image || images.praise}
                        alt="Live worship"
                        className="absolute inset-0 w-full h-full object-cover opacity-40"
                      />
                      <div className="relative text-center text-white">
                        <Badge className="bg-red-600 text-white border-0 mb-3">
                          <span className="mr-1.5 inline-block size-2 rounded-full bg-white animate-pulse" />
                          {streamItems.badge || 'OFFLINE'}
                        </Badge>
                        <h3 className="text-white" style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.5rem' }}>
                          {streamBlock?.title || 'Sunday Celebration Service'}
                        </h3>
                        {nextStart && (
                          <div className="mt-4">
                            <p className="text-white/80">Next service:</p>
                            <p className="text-white text-2xl font-bold">
                              {nextService?.day} at {nextService?.time}
                            </p>
                            <p className="text-white/70 mt-2" id="countdown">
                              {timeLeft || 'Calculating...'}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Optional: show stream description when offline */}
                    {streamBlock?.subtitle && (
                      <div className="p-5 text-center text-white/80">
                        <p>{streamBlock.subtitle}</p>
                      </div>
                    )}
                  </>
                )}
                <div className="p-5">
                  <h3 className="text-church-blue" style={{ fontFamily: 'var(--font-heading)', fontWeight: 600 }}>
                    {streamBlock?.title || 'Sunday Celebration Service'}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {streamBlock?.subtitle || 'Join us for worship, the Word, and prayer. God is doing something beautiful — and you\'re part of it.'}
                  </p>
                </div>
              </Card>
            </Reveal>
          </EditableBlock>

          {/* Chat Column */}
          <EditableBlock block={chatHeadingBlock}>
            <Reveal delay={0.1}>
              <Card className="border-border/60 flex flex-col h-full">
                <div className="p-4 border-b flex items-center gap-2 text-church-blue">
                  <Radio className="size-4 text-gold" />
                  <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 600 }}>
                    {chatHeadingBlock?.title || 'Live Chat'}
                  </span>
                </div>
                <div className="p-4 space-y-3 flex-1 min-h-[240px] max-h-[360px] overflow-y-auto">
                  {/* If live chat is enabled and we are live, show embedded chat here instead of custom chat */}
                  {isLive && liveChatEnabled && platform !== 'unknown' ? (
                    <>
                      {platform === 'youtube' ? (
                        <iframe
                          className="w-full h-full border-0 rounded-lg"
                          src={getYouTubeChatUrl(getYouTubeId(liveStreamUrl) ?? '')}
                          title="Live Chat"
                          allow="autoplay; clipboard-write; encrypted-media; picture-in-picture"
                          style={{ borderRadius: '4px' }}
                        />
                      ) : platform === 'facebook' ? (
                        <iframe
                          className="w-full h-full border-0 rounded-lg"
                          src={`https://www.facebook.com/plugins/comments.php?href=${encodeURIComponent(
                            liveStreamUrl
                          )}&width=500&numposts=5`}
                          title="Facebook Comments"
                          allow="autoplay; clipboard-write; encrypted-media; picture-in-picture"
                          style={{ borderRadius: '4px' }}
                        />
                      ) : null}
                    </>
                  ) : (
                    // Show custom chat
                    <>
                      {chat.map((c) => (
                        <div key={c.id} className="text-sm">
                          <span
                            className={c.name === 'You' ? 'text-gold' : 'text-church-blue'}
                            style={{ fontWeight: 600 }}
                          >
                            {c.name}:
                          </span>
                          <span className="text-muted-foreground">{c.text}</span>
                        </div>
                      ))}
                    </>
                  )}
                </div>
                {!(isLive && liveChatEnabled && platform !== 'unknown') && (
                  <form className="p-4 border-t flex gap-2" onSubmit={sendMessage}>
                    <Input
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder={chatHeadingItems.placeholder || 'Say something kind...'}
                    />
                    <Button type="submit" size="icon" className="bg-church-blue hover:bg-church-blue/90 shrink-0" aria-label="Send message">
                      <Send className="size-4" />
                    </Button>
                  </form>
                )}
              </Card>
            </Reveal>
          </EditableBlock>
        </div>
      </section>

      {/* Schedule Section - always show */}
      <EditableBlock block={scheduleBlock}>
        <div className="mx-auto max-w-7xl px-4 mt-12">
          <Card className="p-6 border-border/60">
            <div className="flex items-center gap-2 text-church-blue mb-4">
              <Calendar className="size-5 text-gold" />
              <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 600 }}>
                {scheduleBlock?.title || 'Weekly Live Schedule'}
              </span>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {serviceTimes.slice(0, 4).map((s) => (
                <div key={s.id} className="rounded-xl bg-section p-4">
                  <div className="text-church-blue" style={{ fontWeight: 600 }}>
                    {s.name}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {s.day} · {s.time}
                  </div>
                </div>
              ))}
            </div>
            <Button asChild className="mt-6 bg-gold text-church-blue hover:bg-gold/90">
              <Link href={scheduleItems.ctaLink || '/events'}>
                {scheduleItems.ctaLabel || 'See All Events'}
              </Link>
            </Button>
          </Card>
        </div>
      </EditableBlock>
    </div>
  )
}