'use client'

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from 'next/link';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { Search, X, Calendar, User, ChevronLeft, ChevronRight, ArrowUpDown } from "lucide-react";
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
import type { BlogPost } from "@/lib/types";

type SortOption = "newest" | "oldest" | "title-asc" | "title-desc";

function useDebouncedValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debouncedValue
}

export default function BlogPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const q = searchParams.get('q') ?? ''
  const category = searchParams.get('category') ?? 'all'
  const sort = (searchParams.get('sort') as SortOption) ?? 'newest'
  const page = parseInt(searchParams.get('page') ?? '1') || 1
  const perPage = parseInt(searchParams.get('per_page') ?? '12') || 12

  const [searchInput, setSearchInput] = useState(q)

  useEffect(() => {
    setSearchInput(q)
  }, [q])

  const debouncedQ = useDebouncedValue(searchInput, 300)

  const updateParams = useCallback((updates: Record<string, string | number | undefined>) => {
    const params = new URLSearchParams(searchParams.toString())
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined && value !== '' && value !== 'all' && value !== 1 && value !== 'newest') {
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
    queryKey: ['blog', 'published', { q: debouncedQ, category, sort, page, perPage }],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (q) params.set('q', q)
      if (category !== 'all') params.set('category', category)
      if (sort !== 'newest') params.set('sort', sort)
      if (page > 1) params.set('page', String(page))
      params.set('per_page', String(perPage))
      const qs = params.toString()
      const { data } = await api.get('/blog/published' + (qs ? '?' + qs : ''))
      return data
    },
  })

  const { data: allPosts = [] } = useQuery({
    queryKey: ['blog', 'all', 'filters'],
    queryFn: async () => {
      const { data } = await api.get('/blog/published?per_page=200')
      return (data.data ?? []) as BlogPost[]
    },
  })

  const hero = useContentBlock('blog_hero')
  const heading = useContentBlock('blog_heading')
  const description = useContentBlock('blog_description')
  const emptyState = useContentBlock('blog_empty_state')

  const searchPlaceholder = heading?.items?.[0]?.search_placeholder ?? "Search articles..."
  const emptyTitle = emptyState?.title ?? "No articles found"
  const emptyDescription = emptyState?.subtitle ?? "Try adjusting your search or filters to find what you're looking for."
  const emptyBtnLabel = emptyState?.items?.[0]?.btn_label ?? "Clear all filters"

  const categories = useMemo(() => ["all", ...Array.from(new Set(allPosts.map((p) => p.category)))], [allPosts])

  const items = pageData?.data ?? []
  const total = (pageData as any)?.total ?? 0
  const returnedPerPage = (pageData as any)?.per_page ?? (pageData as any)?.perPage ?? perPage
  const totalPages = Math.max(1, Math.ceil(total / returnedPerPage))

  const activeFilters = [category !== 'all', q.length > 0].filter(Boolean).length

  const clearFilters = () => {
    setSearchInput('')
    updateParams({ q: '', category: 'all', sort: 'newest', page: 1, per_page: 12 })
  }

  const startItem = (page - 1) * returnedPerPage + 1
  const endItem = Math.min(page * returnedPerPage, total)

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  return (
    <div>
      <EditableBlock block={hero}>
        <PageHero
          title={hero?.title || "Blog"}
          crumb={hero?.items?.[0]?.crumb || "Blog"}
          image={hero?.image || images.cross}
          subtitle={hero?.subtitle || ""}
        />
      </EditableBlock>

      <section className="py-12 bg-section">
        <div className="mx-auto max-w-7xl px-4">
          <EditableBlock block={heading}>
            <SectionHeading
              eyebrow={heading?.items?.[0]?.eyebrow || "Stories & Updates"}
              title={heading?.title || "Blog"}
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
                <Select value={sort} onValueChange={(v) => updateParams({ sort: v, page: 1 })}>
                  <SelectTrigger className="shrink-0 w-auto gap-1.5"><ArrowUpDown className="size-3.5" /><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest First</SelectItem>
                    <SelectItem value="oldest">Oldest First</SelectItem>
                    <SelectItem value="title-asc">Title A–Z</SelectItem>
                    <SelectItem value="title-desc">Title Z–A</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="mt-3 pt-3 border-t border-border/40">
                 <div className="flex flex-wrap gap-2">
                  {categories.map((c) => (
                    <button
                      key={c}
                      onClick={() => updateParams({ category: c, page: 1 })}
                      className={`px-4 py-2 rounded-full text-sm transition-colors ${
                        category === c ? "bg-church-blue text-white" : "bg-secondary text-church-blue hover:bg-gold hover:text-church-blue"
                      }`}
                      aria-pressed={category === c}
                    >
                      {c === "all" ? "All" : c}
                    </button>
                  ))}
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
                      {category !== 'all' && (
                        <Badge variant="secondary" className="gap-1 pr-1">
                          {category}
                          <button onClick={() => updateParams({ category: 'all', page: 1 })} aria-label="Clear category filter" className="ml-0.5 hover:text-foreground"><X className="size-3" /></button>
                        </Badge>
                      )}
                    <button onClick={clearFilters} className="text-xs text-church-blue hover:underline ml-1">Clear all</button>
                  </div>
                )}
              </div>
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
                  ? "No articles found"
                  : `Showing ${startItem}–${endItem} of ${total} articles`}
              </p>
            </div>
          )}

          {isLoading ? (
            <CardSkeleton count={6} />
          ) : error ? (
            <ErrorDisplay message="Failed to load articles. Please try again." onRetry={() => refetch()} />
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
                {items.map((post, i) => (
                  <Reveal key={post.id} delay={(i % 3) * 0.08}>
                    <Link href={`/blog/${post.slug}`}>
                      <Card className="group overflow-hidden h-full border-border/60 hover:shadow-xl transition-all gap-0">
                        <div className="relative aspect-video overflow-hidden">
                          <ImageWithFallback src={post.image} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          <Badge className="absolute top-3 left-3 bg-gold text-church-blue border-0">{post.category}</Badge>
                        </div>
                        <div className="p-5">
                          <h3 className="text-church-blue" style={{ fontFamily: "var(--font-heading)", fontWeight: 600 }}>{post.title}</h3>
                          <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{post.excerpt}</p>
                          <div className="mt-4 flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1"><User className="size-3.5" /> {post.author}</span>
                            <span className="flex items-center gap-1"><Calendar className="size-3.5" /> {formatDate(post.createdAt || post.updatedAt || new Date().toISOString())}</span>
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
