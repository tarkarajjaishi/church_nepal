'use client'

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from 'next/link';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { Play, Search, FileText, Headphones, Video, X, SlidersHorizontal, ArrowUpDown, ChevronLeft, ChevronRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHero } from "@/components/site/PageHero";
import { SectionHeading } from "@/components/site/SectionHeading";
import { Reveal } from "@/components/site/Reveal";
import { CardSkeleton } from "@/components/site/LoadingSpinner";
import { ErrorDisplay } from "@/components/site/ErrorDisplay";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";
import { EditableBlock } from "@/components/site/EditableBlock";
import { images } from "@/lib/data";
import { useContentBlock } from "@/lib/hooks";
import api from "@/lib/api";
import type { Sermon } from "@/lib/data";

type SortOption = "date-desc" | "date-asc" | "title-asc" | "title-desc";

function useDebouncedValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debouncedValue
}

export default function Sermons() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const q = searchParams.get('q') ?? ''
  const speaker = searchParams.get('speaker') ?? 'all'
  const topic = searchParams.get('topic') ?? 'all'
  const seriesParam = searchParams.get('series') ?? 'all'
  const sort = (searchParams.get('sort') as SortOption) ?? 'date-desc'
  const page = parseInt(searchParams.get('page') ?? '1') || 1
  const perPage = parseInt(searchParams.get('per_page') ?? '12') || 12

  const [searchInput, setSearchInput] = useState(q)
  const [showFilters, setShowFilters] = useState(true)

  useEffect(() => {
    setSearchInput(q)
  }, [q])

  const debouncedQ = useDebouncedValue(searchInput, 300)

  const updateParams = useCallback((updates: Record<string, string | number | undefined>) => {
    const params = new URLSearchParams(searchParams.toString())
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined && value !== '' && value !== 'all' && value !== 1 && value !== 'date-desc') {
        params.set(key, String(value))
      } else {
        params.delete(key)
      }
    }
    const qs = params.toString()
    router.replace(`${pathname}${qs ? '?' + qs : ''}`)
  }, [searchParams, router, pathname])

  useEffect(() => {
    updateParams({ q: debouncedQ })
  }, [debouncedQ, updateParams])

  const { data: pageData, isLoading, error, refetch } = useQuery({
    queryKey: ['sermons', 'public', { q: debouncedQ, speaker, topic, series: seriesParam, sort, page, perPage }],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (q) params.set('q', q)
      if (speaker !== 'all') params.set('speaker', speaker)
      if (topic !== 'all') params.set('topic', topic)
      if (seriesParam !== 'all') params.set('series', seriesParam)
      if (sort !== 'date-desc') params.set('sort', sort)
      if (page > 1) params.set('page', String(page))
      params.set('per_page', String(perPage))
      const qs = params.toString()
      const { data } = await api.get('/sermons/public' + (qs ? '?' + qs : ''))
      return data
    },
  })

  const { data: allSermons = [] } = useQuery({
    queryKey: ['sermons', 'all', 'filters'],
    queryFn: async () => {
      const { data } = await api.get('/sermons/public?per_page=200')
      return (data.data ?? []) as Sermon[]
    },
  })

  const speakers = useMemo(() => ["all", ...Array.from(new Set(allSermons.map((s) => s.speaker)))], [allSermons]);
  const topics = useMemo(() => ["all", ...Array.from(new Set(allSermons.map((s) => s.topic)))], [allSermons]);
  const seriesList = useMemo(() => ["all", ...Array.from(new Set(allSermons.map((s) => s.series)))], [allSermons]);

  const hero = useContentBlock('sermons_hero');
  const heading = useContentBlock('sermons_heading');
  const description = useContentBlock('sermons_description');
  const recentHeading = useContentBlock('sermons_recent_heading');
  const emptyState = useContentBlock('sermons_empty_state');

  const searchPlaceholder = heading?.items?.[0]?.search_placeholder ?? "Search by title, speaker, series, or description...";
  const emptyTitle = emptyState?.title ?? "No sermons found";
  const emptyDescription = emptyState?.subtitle ?? "Try adjusting your search or filters to find what you're looking for.";
  const emptyBtnLabel = emptyState?.items?.[0]?.btn_label ?? "Clear all filters";

  const items = pageData?.data ?? []
  const total = (pageData as any)?.total ?? 0
  const returnedPerPage = (pageData as any)?.per_page ?? (pageData as any)?.perPage ?? perPage
  const totalPages = Math.max(1, Math.ceil(total / returnedPerPage))

  const activeFilters = [speaker !== 'all', topic !== 'all', seriesParam !== 'all', q.length > 0].filter(Boolean).length

  const clearFilters = () => {
    setSearchInput('')
    updateParams({ q: '', speaker: 'all', topic: 'all', series: 'all', sort: 'date-desc', page: 1, per_page: 12 })
  }

  const startItem = (page - 1) * returnedPerPage + 1
  const endItem = Math.min(page * returnedPerPage, total)

  return (
    <div>
      <EditableBlock block={hero}>
        <PageHero
          title={hero?.title || "Sermons"}
          crumb={hero?.items?.[0]?.crumb || "Sermons"}
          image={hero?.image || images.praise}
          subtitle={hero?.subtitle || ""}
        />
      </EditableBlock>

      <section className="py-12 bg-section">
        <div className="mx-auto max-w-7xl px-4">
          <EditableBlock block={heading}>
            <SectionHeading
              eyebrow={heading?.items?.[0]?.eyebrow || "Browse & Listen"}
              title={heading?.title || "Sermons"}
              subtitle={description?.title || undefined}
            />
          </EditableBlock>

          <div className="mt-8">
            <Card className="p-4 border-border/60">
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={searchInput}
                    onChange={(e) => { setSearchInput(e.target.value) }}
                    placeholder={searchPlaceholder}
                    className="pl-9"
                  />
                   {searchInput && (
                     <button onClick={() => setSearchInput('')} aria-label="Clear search" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                       <X className="size-4" />
                     </button>
                   )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className={`shrink-0 gap-1.5 ${showFilters ? "bg-church-blue text-white hover:bg-church-blue/90" : ""}`}
                >
                  <SlidersHorizontal className="size-4" />
                  Filters
                  {activeFilters > 0 && (
                    <Badge className="ml-1 size-5 p-0 flex items-center justify-center bg-gold text-church-blue border-0 text-[10px]">
                      {activeFilters}
                    </Badge>
                  )}
                </Button>
              </div>

              {showFilters && (
                <div className="mt-3 pt-3 border-t border-border/40">
                  <div className="grid gap-3 md:grid-cols-4">
                    <Select value={speaker} onValueChange={(v) => updateParams({ speaker: v, page: 1 })}>
                      <SelectTrigger><SelectValue placeholder="Speaker" /></SelectTrigger>
                      <SelectContent>
                        {speakers.map((s) => <SelectItem key={s} value={s}>{s === "all" ? "All Speakers" : s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Select value={topic} onValueChange={(v) => updateParams({ topic: v, page: 1 })}>
                      <SelectTrigger><SelectValue placeholder="Topic" /></SelectTrigger>
                      <SelectContent>
                        {topics.map((t) => <SelectItem key={t} value={t}>{t === "all" ? "All Topics" : t}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Select value={seriesParam} onValueChange={(v) => updateParams({ series: v, page: 1 })}>
                      <SelectTrigger><SelectValue placeholder="Series" /></SelectTrigger>
                      <SelectContent>
                        {seriesList.map((s) => <SelectItem key={s} value={s}>{s === "all" ? "All Series" : s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Select value={sort} onValueChange={(v) => updateParams({ sort: v, page: 1 })}>
                      <SelectTrigger className="gap-1.5"><ArrowUpDown className="size-3.5" /><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="date-desc">Newest First</SelectItem>
                        <SelectItem value="date-asc">Oldest First</SelectItem>
                        <SelectItem value="title-asc">Title A–Z</SelectItem>
                        <SelectItem value="title-desc">Title Z–A</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {activeFilters > 0 && (
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <span className="text-xs text-muted-foreground">Active:</span>
                      {q && (
                        <Badge variant="secondary" className="gap-1 pr-1">
                          "{q}"
                          <button onClick={() => { setSearchInput(''); updateParams({ q: '', page: 1 }) }} aria-label="Clear search query" className="ml-0.5 hover:text-foreground"><X className="size-3" /></button>
                        </Badge>
                      )}
                      {speaker !== 'all' && (
                        <Badge variant="secondary" className="gap-1 pr-1">
                          {speaker}
                          <button onClick={() => updateParams({ speaker: 'all', page: 1 })} aria-label="Clear speaker filter" className="ml-0.5 hover:text-foreground"><X className="size-3" /></button>
                        </Badge>
                      )}
                      {topic !== 'all' && (
                        <Badge variant="secondary" className="gap-1 pr-1">
                          {topic}
                          <button onClick={() => updateParams({ topic: 'all', page: 1 })} aria-label="Clear topic filter" className="ml-0.5 hover:text-foreground"><X className="size-3" /></button>
                        </Badge>
                      )}
                      {seriesParam !== 'all' && (
                        <Badge variant="secondary" className="gap-1 pr-1">
                          {seriesParam}
                          <button onClick={() => updateParams({ series: 'all', page: 1 })} aria-label="Clear series filter" className="ml-0.5 hover:text-foreground"><X className="size-3" /></button>
                        </Badge>
                      )}
                      <button onClick={clearFilters} className="text-xs text-church-blue hover:underline ml-1">Clear all</button>
                    </div>
                  )}
                </div>
              )}
            </Card>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4">
          {!isLoading && !error && (
            <div className="mb-6 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {total === 0
                  ? "No sermons found"
                  : `Showing ${startItem}–${endItem} of ${total} sermons`}
              </p>
            </div>
          )}

          {isLoading ? (
            <CardSkeleton count={6} />
          ) : error ? (
            <ErrorDisplay message="Failed to load sermons. Please try again." onRetry={() => refetch()} />
          ) : items.length === 0 ? (
            <div className="text-center py-16">
              <div className="size-16 rounded-full bg-gray-100 grid place-items-center mx-auto mb-4">
                <Search className="size-7 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">{emptyTitle}</h3>
              <p className="text-muted-foreground max-w-md mx-auto mb-6">
                {emptyDescription}
              </p>
              <Button variant="outline" onClick={clearFilters} className="gap-2">
                <X className="size-4" /> {emptyBtnLabel}
              </Button>
            </div>
          ) : (
            <>
              <div className="grid gap-6 md:grid-cols-3">
                {items.map((s, i) => (
                  <Reveal key={s.id} delay={(i % 3) * 0.08}>
                    <Link href={`/sermons/${s.id}`}>
                      <Card className="group overflow-hidden h-full border-border/60 hover:shadow-xl transition-all gap-0">
                        <div className="relative aspect-video overflow-hidden">
                          <ImageWithFallback src={s.image} alt={s.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          <div className="absolute inset-0 bg-church-blue/20 group-hover:bg-church-blue/40 transition-colors grid place-items-center">
                            <span className="grid place-items-center size-14 rounded-full bg-white/90 text-church-blue group-hover:scale-110 transition-transform"><Play className="size-6 fill-church-blue" /></span>
                          </div>
                          <Badge className="absolute top-3 left-3 bg-gold text-church-blue border-0">{s.series}</Badge>
                        </div>
                        <div className="p-5">
                          <div className="text-xs text-muted-foreground">{s.speaker} · {s.date} · {s.duration}</div>
                          <h3 className="mt-1 text-church-blue" style={{ fontFamily: "var(--font-heading)", fontWeight: 600 }}>{s.title}</h3>
                          <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{s.description}</p>
                          <div className="mt-4 flex gap-2">
                            {s.videoUrl && <Button size="sm" className="bg-church-blue hover:bg-church-blue/90"><Video className="size-4" /> Video</Button>}
                            {s.audioUrl && <Button size="sm" variant="outline"><Headphones className="size-4" /> Audio</Button>}
                            <Button size="sm" variant="outline"><FileText className="size-4" /> Notes</Button>
                          </div>
                        </div>
                      </Card>
                    </Link>
                  </Reveal>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="mt-10 flex items-center justify-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => updateParams({ page: page - 1 })}
                    className="gap-1"
                  >
                    <ChevronLeft className="size-4" /> Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => updateParams({ page: page + 1 })}
                    className="gap-1"
                  >
                    Next <ChevronRight className="size-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
}
