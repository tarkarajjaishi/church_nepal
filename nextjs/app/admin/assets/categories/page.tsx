'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Tags, Plus, X, Save } from 'lucide-react'
import { assetsApi } from '@/lib/assets/api'
import {
  CARD, PageHeader, EmptyState, TableSkeleton, Chip, btn, field, Label,
} from '@/components/offerings/ui'

export default function AssetCategoriesPage() {
  const qc = useQueryClient()
  const [creating, setCreating] = useState(false)
  const [f, setF] = useState({ name: '', life: '5', reservable: false, description: '' })

  const { data, isLoading } = useQuery({
    queryKey: ['asset-categories'],
    queryFn: assetsApi.categories,
  })

  const create = useMutation({
    mutationFn: () =>
      assetsApi.createCategory({
        name: f.name.trim(),
        description: f.description.trim(),
        default_useful_life_years: Number(f.life) || 5,
        is_reservable: f.reservable,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['asset-categories'] })
      toast.success('Category added')
      setCreating(false)
      setF({ name: '', life: '5', reservable: false, description: '' })
    },
    onError: (e: Error) => toast.error(e.message || 'Could not add this category'),
  })

  return (
    <>
      <PageHeader
        title="Categories"
        subtitle="Each category sets a default useful life for depreciation"
        actions={
          <button type="button" onClick={() => setCreating((v) => !v)} className={btn.primary}>
            <Plus className="size-4" aria-hidden /> Add Category
          </button>
        }
      />

      {creating && (
        <section className={`${CARD} p-4 sm:p-5 mb-4`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">New category</h2>
            <button type="button" onClick={() => setCreating(false)} className={btn.ghost} aria-label="Close">
              <X className="size-4" aria-hidden />
            </button>
          </div>
          <form onSubmit={(e) => { e.preventDefault(); if (f.name.trim()) create.mutate() }} className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label htmlFor="c-name" required>Name</Label>
              <input id="c-name" className={field} value={f.name} onChange={(e) => setF((s) => ({ ...s, name: e.target.value }))} />
            </div>
            <div>
              <Label htmlFor="c-life" hint="Years, used for depreciation">Default useful life</Label>
              <input id="c-life" inputMode="numeric" className={field} value={f.life} onChange={(e) => setF((s) => ({ ...s, life: e.target.value.replace(/[^\d]/g, '') }))} />
            </div>
            <div>
              <Label htmlFor="c-desc">Description</Label>
              <input id="c-desc" className={field} value={f.description} onChange={(e) => setF((s) => ({ ...s, description: e.target.value }))} />
            </div>
            <div className="sm:col-span-3">
              <label className="inline-flex items-center gap-2 cursor-pointer text-sm">
                <input type="checkbox" checked={f.reservable} onChange={(e) => setF((s) => ({ ...s, reservable: e.target.checked }))} className="size-4 rounded border-border accent-[var(--church-blue)]" />
                Assets in this category can be booked out
              </label>
            </div>
            <div className="sm:col-span-3 flex justify-end gap-2">
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
        {isLoading ? (
          <TableSkeleton cols={4} />
        ) : !data?.length ? (
          <EmptyState icon={Tags} title="No categories" subtitle="Migration 066 seeds 26 of them." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10 bg-card/95 backdrop-blur border-b border-border">
                <tr>
                  {['Category', 'Assets', 'Default life', 'Bookable', 'Status'].map((h) => (
                    <th key={h} scope="col" className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((c) => (
                  <tr key={c.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-2 font-medium">
                        <span className="size-3 rounded-full shrink-0" style={{ backgroundColor: c.color }} aria-hidden />
                        {c.name}
                      </span>
                      {c.description && <p className="text-xs text-muted-foreground mt-0.5">{c.description}</p>}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-muted-foreground">{c.assetCount}</td>
                    <td className="px-4 py-3 tabular-nums text-muted-foreground">{c.defaultUsefulLifeYears} years</td>
                    <td className="px-4 py-3">
                      {c.isReservable
                        ? <Chip className="bg-green-100 text-green-800 border-green-200">Bookable</Chip>
                        : <span className="text-muted-foreground text-xs">—</span>}
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
