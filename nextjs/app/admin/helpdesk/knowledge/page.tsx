'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { BookOpen, Plus, X, Save, Search, ThumbsUp } from 'lucide-react'
import { helpdeskApi } from '@/lib/helpdesk/api'
import {
  CARD, PageHeader, EmptyState, ErrorState, Chip, btn, field, Label,
} from '@/components/offerings/ui'

const EMPTY = { title: '', body: '', categoryId: '', keywords: '' }

export default function KnowledgePage() {
  const qc = useQueryClient()
  const [creating, setCreating] = useState(false)
  const [f, setF] = useState(EMPTY)
  const [search, setSearch] = useState('')
  const [query, setQuery] = useState('')
  const [openId, setOpenId] = useState<string | null>(null)

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['helpdesk', 'articles', query],
    queryFn: () => helpdeskApi.articles({ search: query || undefined }),
  })
  const { data: cats } = useQuery({ queryKey: ['helpdesk', 'categories'], queryFn: helpdeskApi.categories })

  const create = useMutation({
    mutationFn: () =>
      helpdeskApi.createArticle({
        title: f.title.trim(),
        body: f.body.trim(),
        category_id: f.categoryId || undefined,
        keywords: f.keywords.trim(),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['helpdesk', 'articles'] })
      toast.success('Article published')
      setCreating(false)
      setF(EMPTY)
    },
    onError: (e: Error) => toast.error(e.message || 'Could not publish this'),
  })

  const helpful = useMutation({
    mutationFn: (id: string) => helpdeskApi.markHelpful(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['helpdesk', 'articles'] })
      toast.success('Noted — thanks')
    },
    onError: (e: Error) => toast.error(e.message || 'Could not record that'),
  })

  return (
    <>
      <PageHeader
        title="Knowledge base"
        subtitle="The answers that stop the same ticket being raised every month"
        actions={
          <button type="button" onClick={() => setCreating((v) => !v)} className={btn.primary}>
            <Plus className="size-4" aria-hidden /> Write an article
          </button>
        }
      />

      {creating && (
        <section className={`${CARD} p-4 sm:p-5 mb-4`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">New article</h2>
            <button type="button" onClick={() => setCreating(false)} className={btn.ghost} aria-label="Close">
              <X className="size-4" aria-hidden />
            </button>
          </div>
          <form onSubmit={(e) => { e.preventDefault(); if (f.title.trim()) create.mutate() }} className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="a-title" required>Title</Label>
              <input id="a-title" className={field} placeholder="What to do when…" value={f.title} onChange={(e) => setF((s) => ({ ...s, title: e.target.value }))} />
            </div>
            <div>
              <Label htmlFor="a-cat">Area</Label>
              <select id="a-cat" className={field} value={f.categoryId} onChange={(e) => setF((s) => ({ ...s, categoryId: e.target.value }))}>
                <option value="">Any</option>
                {cats?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <Label htmlFor="a-keys" hint="Comma-separated, helps people find it">Keywords</Label>
              <input id="a-keys" className={field} value={f.keywords} onChange={(e) => setF((s) => ({ ...s, keywords: e.target.value }))} />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="a-body">Steps</Label>
              <textarea id="a-body" rows={5} className={`${field} py-2`} value={f.body} onChange={(e) => setF((s) => ({ ...s, body: e.target.value }))} />
            </div>
            <div className="sm:col-span-2 flex justify-end gap-2">
              <button type="button" onClick={() => setCreating(false)} className={btn.secondary}>Cancel</button>
              <button type="submit" disabled={!f.title.trim() || create.isPending} className={btn.primary}>
                <Save className="size-4" aria-hidden />
                {create.isPending ? 'Publishing…' : 'Publish'}
              </button>
            </div>
          </form>
        </section>
      )}

      <div className={`${CARD} p-3 sm:p-4 mb-4`}>
        <form onSubmit={(e) => { e.preventDefault(); setQuery(search.trim()) }} className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" aria-hidden />
          <input
            className={`${field} pl-9`}
            placeholder="Search the answers"
            aria-label="Search the knowledge base"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </form>
      </div>

      {error ? (
        <div className={CARD}><ErrorState message={(error as Error).message} onRetry={() => refetch()} /></div>
      ) : isLoading ? (
        <div className="grid gap-3" aria-busy="true">
          {[0, 1, 2].map((i) => <div key={i} className="h-24 rounded-2xl bg-muted animate-pulse" />)}
        </div>
      ) : !data?.length ? (
        <div className={CARD}>
          <EmptyState
            icon={BookOpen}
            title={query ? 'Nothing matches that' : 'No articles yet'}
            subtitle={query ? 'Try a different word, or write the answer yourself.' : 'Write down the fix for something that keeps coming back.'}
            action={<button type="button" onClick={() => setCreating(true)} className={btn.primary}>Write an article</button>}
          />
        </div>
      ) : (
        <ul className="grid gap-3">
          {data.map((a) => {
            const open = openId === a.id
            return (
              <li key={a.id} className={`${CARD} p-4 sm:p-5`}>
                <button
                  type="button"
                  onClick={() => setOpenId(open ? null : a.id)}
                  aria-expanded={open}
                  className="w-full text-left"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="font-medium">{a.title}</h2>
                      <div className="flex flex-wrap items-center gap-2 mt-1.5">
                        {a.categoryName && (
                          <Chip className="bg-muted text-foreground border-border">{a.categoryName}</Chip>
                        )}
                        {a.helpfulCount > 0 && (
                          <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
                            <ThumbsUp className="size-3" aria-hidden /> {a.helpfulCount} found this useful
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
                {open && (
                  <div className="mt-3 pt-3 border-t border-border">
                    <p className="text-sm whitespace-pre-wrap">{a.body || 'No steps written yet.'}</p>
                    {a.keywords && (
                      <p className="text-xs text-muted-foreground mt-3">Keywords: {a.keywords}</p>
                    )}
                    <button
                      type="button"
                      onClick={() => helpful.mutate(a.id)}
                      disabled={helpful.isPending}
                      className={`${btn.secondary} mt-3`}
                    >
                      <ThumbsUp className="size-4" aria-hidden /> This helped
                    </button>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </>
  )
}
