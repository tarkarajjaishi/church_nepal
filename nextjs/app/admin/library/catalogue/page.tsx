'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  Library, Plus, X, Save, Search, BookOpen, Monitor, ChevronLeft, ChevronRight,
} from 'lucide-react'
import { libraryApi, type BookRow, type BookFilters } from '@/lib/library/api'
import {
  CARD, PageHeader, EmptyState, ErrorState, TableSkeleton, Chip, btn, field, Label,
} from '@/components/offerings/ui'

const KINDS = [
  { value: 'book', label: 'Book' },
  { value: 'ebook', label: 'E-book' },
  { value: 'audio', label: 'Audio' },
  { value: 'video', label: 'Video' },
  { value: 'periodical', label: 'Periodical' },
]

/**
 * Availability chip.
 *
 * Reads the server's derived counts. It never adds up copies locally — a
 * number computed in the browser goes stale the moment someone else borrows.
 */
function Availability({ b }: { b: BookRow }) {
  if (b.materialKind !== 'book') {
    return <Chip className="bg-church-blue-surface text-church-blue-ink border-transparent">Digital</Chip>
  }
  if (b.totalCopies === 0) {
    return <Chip className="bg-gray-100 text-gray-700 border-gray-200">No copies</Chip>
  }
  if (b.availableCopies === 0) {
    return (
      <Chip className="bg-amber-100 text-amber-800 border-amber-200">
        All {b.totalCopies} out{b.holdsWaiting > 0 ? ` · ${b.holdsWaiting} waiting` : ''}
      </Chip>
    )
  }
  return (
    <Chip className="bg-green-100 text-green-800 border-green-200">
      {b.availableCopies} of {b.totalCopies} on shelf
    </Chip>
  )
}

const EMPTY = {
  title: '', authors: '', isbn: '', publisher: '', language: 'English',
  categoryId: '', materialKind: 'book', digitalUrl: '', year: '', pages: '',
  copies: '1', shelf: '',
}

export default function CataloguePage() {
  const qc = useQueryClient()
  const [creating, setCreating] = useState(false)
  const [f, setF] = useState(EMPTY)
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState<BookFilters>({ page: 1, per_page: 25 })

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['library', 'books', filters],
    queryFn: () => libraryApi.books(filters),
  })
  const { data: cats } = useQuery({ queryKey: ['library', 'categories'], queryFn: libraryApi.categories })

  const create = useMutation({
    mutationFn: () =>
      libraryApi.createBook({
        title: f.title.trim(),
        // Split on comma so "Howard Taylor, Geraldine Taylor" catalogues both.
        authors: f.authors.split(',').map((a) => a.trim()).filter(Boolean),
        isbn: f.isbn.trim(),
        publisher: f.publisher.trim(),
        language: f.language.trim() || 'English',
        category_id: f.categoryId || undefined,
        material_kind: f.materialKind,
        digital_url: f.digitalUrl.trim(),
        publication_year: f.year ? Number(f.year) : undefined,
        pages: f.pages ? Number(f.pages) : undefined,
        copies: f.materialKind === 'book' ? Number(f.copies || 1) : 0,
        shelf: f.shelf.trim(),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['library'] })
      toast.success('Book catalogued')
      setCreating(false)
      setF(EMPTY)
    },
    onError: (e: Error) => toast.error(e.message || 'Could not catalogue this book'),
  })

  const apply = (patch: Partial<BookFilters>) =>
    setFilters((s) => ({ ...s, ...patch, page: patch.page ?? 1 }))

  const page = data?.page ?? 1
  const totalPages = data?.totalPages ?? 1

  return (
    <>
      <PageHeader
        title="Catalogue"
        subtitle="Every title the church owns, and how many are on the shelf right now"
        actions={
          <button type="button" onClick={() => setCreating((v) => !v)} className={btn.primary}>
            <Plus className="size-4" aria-hidden /> Add Book
          </button>
        }
      />

      {creating && (
        <section className={`${CARD} p-4 sm:p-5 mb-4`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">New title</h2>
            <button type="button" onClick={() => setCreating(false)} className={btn.ghost} aria-label="Close">
              <X className="size-4" aria-hidden />
            </button>
          </div>
          <form
            onSubmit={(e) => { e.preventDefault(); if (f.title.trim()) create.mutate() }}
            className="grid gap-4 sm:grid-cols-3"
          >
            <div className="sm:col-span-2">
              <Label htmlFor="b-title" required>Title</Label>
              <input id="b-title" className={field} value={f.title} onChange={(e) => setF((s) => ({ ...s, title: e.target.value }))} />
            </div>
            <div>
              <Label htmlFor="b-authors" hint="Comma-separated">Author(s)</Label>
              <input id="b-authors" className={field} value={f.authors} onChange={(e) => setF((s) => ({ ...s, authors: e.target.value }))} />
            </div>
            <div>
              <Label htmlFor="b-cat">Subject</Label>
              <select id="b-cat" className={field} value={f.categoryId} onChange={(e) => setF((s) => ({ ...s, categoryId: e.target.value }))}>
                <option value="">Uncategorised</option>
                {cats?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <Label htmlFor="b-kind">Material</Label>
              <select id="b-kind" className={field} value={f.materialKind} onChange={(e) => setF((s) => ({ ...s, materialKind: e.target.value }))}>
                {KINDS.map((k) => <option key={k.value} value={k.value}>{k.label}</option>)}
              </select>
            </div>
            <div>
              <Label htmlFor="b-lang">Language</Label>
              <input id="b-lang" className={field} value={f.language} onChange={(e) => setF((s) => ({ ...s, language: e.target.value }))} />
            </div>
            <div>
              <Label htmlFor="b-isbn">ISBN</Label>
              <input id="b-isbn" className={field} value={f.isbn} onChange={(e) => setF((s) => ({ ...s, isbn: e.target.value }))} />
            </div>
            <div>
              <Label htmlFor="b-pub">Publisher</Label>
              <input id="b-pub" className={field} value={f.publisher} onChange={(e) => setF((s) => ({ ...s, publisher: e.target.value }))} />
            </div>
            <div>
              <Label htmlFor="b-year">Year</Label>
              <input id="b-year" type="number" className={field} value={f.year} onChange={(e) => setF((s) => ({ ...s, year: e.target.value }))} />
            </div>
            <div>
              <Label htmlFor="b-pages">Pages</Label>
              <input id="b-pages" type="number" className={field} value={f.pages} onChange={(e) => setF((s) => ({ ...s, pages: e.target.value }))} />
            </div>

            {f.materialKind === 'book' ? (
              <>
                <div>
                  <Label htmlFor="b-copies" hint="Each gets its own barcode">Copies</Label>
                  <input id="b-copies" type="number" min={0} max={100} className={field} value={f.copies} onChange={(e) => setF((s) => ({ ...s, copies: e.target.value }))} />
                </div>
                <div>
                  <Label htmlFor="b-shelf">Shelf</Label>
                  <input id="b-shelf" className={field} placeholder="A-1" value={f.shelf} onChange={(e) => setF((s) => ({ ...s, shelf: e.target.value }))} />
                </div>
              </>
            ) : (
              <div className="sm:col-span-2">
                <Label htmlFor="b-url" hint="Digital material is linked, never lent">Link</Label>
                <input id="b-url" className={field} value={f.digitalUrl} onChange={(e) => setF((s) => ({ ...s, digitalUrl: e.target.value }))} />
              </div>
            )}

            <div className="sm:col-span-3 flex justify-end gap-2">
              <button type="button" onClick={() => setCreating(false)} className={btn.secondary}>Cancel</button>
              <button type="submit" disabled={!f.title.trim() || create.isPending} className={btn.primary}>
                <Save className="size-4" aria-hidden />
                {create.isPending ? 'Saving…' : 'Add to catalogue'}
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Filters */}
      <div className={`${CARD} p-3 sm:p-4 mb-4`}>
        <form
          onSubmit={(e) => { e.preventDefault(); apply({ search: search.trim() || undefined }) }}
          className="grid gap-3 sm:grid-cols-4"
        >
          <div className="sm:col-span-2 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" aria-hidden />
            <input
              className={`${field} pl-9`}
              placeholder="Title, author, ISBN or keyword"
              aria-label="Search the catalogue"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className={field}
            aria-label="Subject"
            value={filters.category_id ?? ''}
            onChange={(e) => apply({ category_id: e.target.value || undefined })}
          >
            <option value="">All subjects</option>
            {cats?.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.bookCount})</option>)}
          </select>
          <select
            className={field}
            aria-label="Availability"
            value={filters.availability ?? ''}
            onChange={(e) => apply({ availability: (e.target.value || undefined) as BookFilters['availability'] })}
          >
            <option value="">Everything</option>
            <option value="available">On the shelf</option>
            <option value="on_loan">Out on loan</option>
            <option value="digital">Digital only</option>
          </select>
        </form>
      </div>

      <div className={`${CARD} overflow-hidden`}>
        {error ? (
          <ErrorState message={(error as Error).message} onRetry={() => refetch()} />
        ) : isLoading ? (
          <TableSkeleton cols={5} />
        ) : !data?.data.length ? (
          <EmptyState
            icon={Library}
            title="Nothing here"
            subtitle={filters.search || filters.category_id ? 'No title matches these filters.' : 'Catalogue the first book to get started.'}
            action={<button type="button" onClick={() => setCreating(true)} className={btn.primary}>Add Book</button>}
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 z-10 bg-card/95 backdrop-blur border-b border-border">
                  <tr>
                    {['Title', 'Subject', 'Language', 'Availability', 'Shelf status'].map((h) => (
                      <th key={h} scope="col" className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.data.map((b) => (
                    <tr key={b.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                      <td className="px-4 py-3">
                        <Link href={`/admin/library/catalogue/${b.id}`} className="font-medium hover:text-primary transition-colors inline-flex items-center gap-1.5">
                          {b.materialKind === 'book'
                            ? <BookOpen className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
                            : <Monitor className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />}
                          {b.title}
                        </Link>
                        {b.authors.length > 0 && (
                          <p className="text-xs text-muted-foreground truncate max-w-[22rem]">{b.authors.join(', ')}</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {b.categoryName
                          ? <Chip className="bg-muted text-foreground border-border" dot={b.categoryColor}>{b.categoryName}</Chip>
                          : <span className="text-muted-foreground">—</span>}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{b.language}</td>
                      <td className="px-4 py-3"><Availability b={b} /></td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                        {b.outOfCirculation > 0
                          ? <span className="text-amber-700">{b.outOfCirculation} out of circulation</span>
                          : b.materialKind === 'book' ? '—' : 'n/a'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-border">
              <p className="text-xs text-muted-foreground">
                {data.total} title{data.total === 1 ? '' : 's'} · page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                <button type="button" disabled={page <= 1} onClick={() => apply({ page: page - 1 })} className={btn.secondary} aria-label="Previous page">
                  <ChevronLeft className="size-4" aria-hidden /> Prev
                </button>
                <button type="button" disabled={page >= totalPages} onClick={() => apply({ page: page + 1 })} className={btn.secondary} aria-label="Next page">
                  Next <ChevronRight className="size-4" aria-hidden />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  )
}
