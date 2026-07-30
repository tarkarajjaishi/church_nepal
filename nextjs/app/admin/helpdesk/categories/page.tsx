'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Tags, Plus, X, Save, Info } from 'lucide-react'
import { helpdeskApi, duration } from '@/lib/helpdesk/api'
import {
  CARD, PageHeader, EmptyState, ErrorState, TableSkeleton, Chip, btn, field, Label,
} from '@/components/offerings/ui'

const EMPTY = { name: '', description: '', color: '#0b3c5d', responseHours: '24', resolveHours: '72' }

export default function CategoriesPage() {
  const qc = useQueryClient()
  const [creating, setCreating] = useState(false)
  const [f, setF] = useState(EMPTY)

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['helpdesk', 'categories'],
    queryFn: helpdeskApi.categories,
  })

  const create = useMutation({
    mutationFn: () =>
      helpdeskApi.createCategory({
        name: f.name.trim(),
        description: f.description.trim(),
        color: f.color,
        response_hours: Number(f.responseHours),
        resolve_hours: Number(f.resolveHours),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['helpdesk'] })
      toast.success('Category added')
      setCreating(false)
      setF(EMPTY)
    },
    onError: (e: Error) => toast.error(e.message || 'Could not add this category'),
  })

  return (
    <>
      <PageHeader
        title="Categories & service targets"
        subtitle="How quickly each kind of problem should be answered and fixed"
        actions={
          <button type="button" onClick={() => setCreating((v) => !v)} className={btn.primary}>
            <Plus className="size-4" aria-hidden /> Add category
          </button>
        }
      />

      <div className="rounded-2xl border border-border bg-muted p-4 mb-4 flex items-start gap-2.5 text-sm text-muted-foreground">
        <Info className="size-4 shrink-0 mt-0.5" aria-hidden />
        <p>
          A ticket takes its targets from its category the moment it is raised. Changing the
          numbers here shapes future tickets and the live breach view — it never moves the
          deadline on a ticket someone is already working to.
        </p>
      </div>

      {creating && (
        <section className={`${CARD} p-4 sm:p-5 mb-4`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">New category</h2>
            <button type="button" onClick={() => setCreating(false)} className={btn.ghost} aria-label="Close">
              <X className="size-4" aria-hidden />
            </button>
          </div>
          <form onSubmit={(e) => { e.preventDefault(); if (f.name.trim()) create.mutate() }} className="grid gap-4 sm:grid-cols-4">
            <div className="sm:col-span-2">
              <Label htmlFor="c-name" required>Name</Label>
              <input id="c-name" className={field} value={f.name} onChange={(e) => setF((s) => ({ ...s, name: e.target.value }))} />
            </div>
            <div>
              <Label htmlFor="c-resp" hint="Hours">Reply within</Label>
              <input id="c-resp" type="number" min={1} className={field} value={f.responseHours} onChange={(e) => setF((s) => ({ ...s, responseHours: e.target.value }))} />
            </div>
            <div>
              <Label htmlFor="c-res" hint="Hours">Fix within</Label>
              <input id="c-res" type="number" min={1} className={field} value={f.resolveHours} onChange={(e) => setF((s) => ({ ...s, resolveHours: e.target.value }))} />
            </div>
            <div className="sm:col-span-3">
              <Label htmlFor="c-desc">What belongs here</Label>
              <input id="c-desc" className={field} value={f.description} onChange={(e) => setF((s) => ({ ...s, description: e.target.value }))} />
            </div>
            <div>
              <Label htmlFor="c-color">Colour</Label>
              <input id="c-color" type="color" className="w-full h-10 rounded-xl border border-border bg-background" value={f.color} onChange={(e) => setF((s) => ({ ...s, color: e.target.value }))} />
            </div>
            <div className="sm:col-span-4 flex justify-end gap-2">
              <button type="button" onClick={() => setCreating(false)} className={btn.secondary}>Cancel</button>
              <button type="submit" disabled={!f.name.trim() || create.isPending} className={btn.primary}>
                <Save className="size-4" aria-hidden />
                {create.isPending ? 'Saving…' : 'Add category'}
              </button>
            </div>
          </form>
        </section>
      )}

      <div className={`${CARD} overflow-hidden`}>
        {error ? (
          <ErrorState message={(error as Error).message} onRetry={() => refetch()} />
        ) : isLoading ? (
          <TableSkeleton cols={5} />
        ) : !data?.length ? (
          <EmptyState icon={Tags} title="No categories" subtitle="Add the kinds of problem people report." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10 bg-card/95 backdrop-blur border-b border-border">
                <tr>
                  {['Area', 'Reply within', 'Fix within', 'Open now', 'Status'].map((h) => (
                    <th key={h} scope="col" className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((c) => (
                  <tr key={c.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="size-2.5 rounded-full shrink-0" style={{ backgroundColor: c.color }} aria-hidden />
                        <span className="font-medium">{c.name}</span>
                      </div>
                      {c.description && <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[24rem]">{c.description}</p>}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">{duration(c.responseHours)}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{duration(c.resolveHours)}</td>
                    <td className="px-4 py-3 tabular-nums">
                      {c.openCount > 0 ? (
                        <Link href={`/admin/helpdesk/tickets?category_id=${c.id}`} className="hover:text-primary transition-colors">
                          {c.openCount}
                        </Link>
                      ) : <span className="text-muted-foreground">0</span>}
                    </td>
                    <td className="px-4 py-3">
                      {c.isActive
                        ? <Chip className="bg-green-100 text-green-800 border-green-200">Active</Chip>
                        : <Chip className="bg-gray-100 text-gray-700 border-gray-200">Inactive</Chip>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}
