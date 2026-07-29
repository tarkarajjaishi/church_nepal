'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Plus, Save, Tag, Trash2, Percent } from 'lucide-react'
import { offeringsApi, type Fund, type OfferingCategory } from '@/lib/offerings/api'
import {
  CARD,
  PageHeader,
  EmptyState,
  TableSkeleton,
  Chip,
  btn,
  field,
  Label,
} from '@/components/offerings/ui'

/** Preset swatches so categories stay within the palette instead of arbitrary hex. */
const SWATCHES = [
  '#0b3c5d', '#1f6f8b', '#d4a017', '#7c3aed', '#0891b2', '#ea580c',
  '#16a34a', '#db2777', '#2563eb', '#e11d48', '#0f766e', '#65a30d',
]

export default function OfferingSettingsPage() {
  const qc = useQueryClient()
  const [creating, setCreating] = useState(false)
  const [draft, setDraft] = useState({ name: '', description: '', color: SWATCHES[0] })
  const [allocFor, setAllocFor] = useState<OfferingCategory | null>(null)

  const { data: categories, isLoading } = useQuery({
    queryKey: ['offering-categories'],
    queryFn: offeringsApi.categories,
  })
  const { data: funds } = useQuery({ queryKey: ['funds'], queryFn: offeringsApi.funds, staleTime: 5 * 60_000 })

  const invalidate = () => qc.invalidateQueries({ queryKey: ['offering-categories'] })

  const create = useMutation({
    mutationFn: () =>
      offeringsApi.createCategory({
        name: draft.name.trim(),
        description: draft.description.trim(),
        color: draft.color,
      }),
    onSuccess: () => {
      invalidate()
      toast.success('Category added')
      setCreating(false)
      setDraft({ name: '', description: '', color: SWATCHES[0] })
    },
    onError: (e: Error) => toast.error(e.message || 'Could not add this category'),
  })

  const toggleActive = useMutation({
    mutationFn: (c: OfferingCategory) =>
      offeringsApi.updateCategory(c.id, { name: c.name, is_active: !c.isActive }),
    onSuccess: () => invalidate(),
    onError: (e: Error) => toast.error(e.message || 'Could not update this category'),
  })

  const remove = useMutation({
    mutationFn: (id: string) => offeringsApi.deleteCategory(id),
    onSuccess: (res: { deactivated?: boolean; reason?: string }) => {
      invalidate()
      // The API refuses to delete a category that has offerings against it and
      // deactivates instead — say so rather than reporting a plain success.
      if (res.deactivated) toast.info(res.reason ?? 'Category deactivated because it is in use')
      else toast.success('Category deleted')
    },
    onError: (e: Error) => toast.error(e.message || 'Could not delete this category'),
  })

  const confirmRemove = (c: OfferingCategory) => {
    if (window.confirm(`Delete "${c.name}"? If offerings use it, it will be deactivated instead.`)) {
      remove.mutate(c.id)
    }
  }

  return (
    <>
      <PageHeader
        title="Settings"
        subtitle="Offering categories and how each one is split across funds"
        actions={
          <button type="button" onClick={() => setCreating((v) => !v)} className={btn.primary}>
            <Plus className="size-4" aria-hidden />
            Add Category
          </button>
        }
      />

      {creating && (
        <section className={`${CARD} p-4 sm:p-5 mb-4`}>
          <h2 className="font-semibold mb-4">New category</h2>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (draft.name.trim()) create.mutate()
            }}
            className="grid gap-4 sm:grid-cols-2"
          >
            <div>
              <Label htmlFor="c-name" required>Name</Label>
              <input id="c-name" className={field} value={draft.name} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} placeholder="e.g. Harvest Offering" />
            </div>
            <div>
              <Label htmlFor="c-desc">Description</Label>
              <input id="c-desc" className={field} value={draft.description} onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))} />
            </div>
            <div className="sm:col-span-2">
              <Label>Colour</Label>
              <div className="flex flex-wrap gap-2">
                {SWATCHES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setDraft((d) => ({ ...d, color: s }))}
                    aria-label={`Use colour ${s}`}
                    aria-pressed={draft.color === s}
                    className={`size-9 rounded-lg border-2 transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                      draft.color === s ? 'border-foreground scale-110' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: s }}
                  />
                ))}
              </div>
            </div>
            <div className="sm:col-span-2 flex justify-end gap-2">
              <button type="button" onClick={() => setCreating(false)} className={btn.secondary}>Cancel</button>
              <button type="submit" disabled={!draft.name.trim() || create.isPending} className={btn.primary}>
                <Save className="size-4" aria-hidden />
                {create.isPending ? 'Saving…' : 'Save category'}
              </button>
            </div>
          </form>
        </section>
      )}

      <div className={`${CARD} overflow-hidden`}>
        <div className="p-4 sm:p-5 border-b border-border">
          <h2 className="font-semibold">Offering categories</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {categories?.length ?? 0} total · {categories?.filter((c) => c.isActive).length ?? 0} active
          </p>
        </div>
        {isLoading ? (
          <TableSkeleton cols={5} />
        ) : !categories?.length ? (
          <EmptyState icon={Tag} title="No categories yet" subtitle="Add one to start recording offerings." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  {['Category', 'Description', 'Default fund', 'Status', ''].map((h) => (
                    <th key={h} scope="col" className="text-left px-4 py-2 font-medium text-muted-foreground whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {categories.map((c) => (
                  <tr key={c.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-2 font-medium">
                        <span className="size-3 rounded-full shrink-0" style={{ backgroundColor: c.color }} aria-hidden />
                        {c.name}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground max-w-[20rem] truncate" title={c.description}>
                      {c.description || '—'}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {funds?.find((f) => f.id === c.defaultFundId)?.name ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      {c.isActive ? (
                        <Chip className="bg-green-100 text-green-800 border-green-200">Active</Chip>
                      ) : (
                        <Chip className="bg-gray-100 text-gray-700 border-gray-200">Inactive</Chip>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <span className="inline-flex gap-1">
                        <button type="button" onClick={() => setAllocFor(c)} className={btn.ghost}>
                          <Percent className="size-3.5" aria-hidden />
                          Allocation
                        </button>
                        <button type="button" onClick={() => toggleActive.mutate(c)} className={btn.ghost}>
                          {c.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                        <button type="button" onClick={() => confirmRemove(c)} className={btn.ghost} aria-label={`Delete ${c.name}`}>
                          <Trash2 className="size-3.5 text-destructive" aria-hidden />
                        </button>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {allocFor && (
        <AllocationEditor
          category={allocFor}
          funds={funds ?? []}
          onClose={() => setAllocFor(null)}
        />
      )}
    </>
  )
}

/**
 * Fund allocation editor.
 *
 * Percentages must total exactly 100%; the API rejects anything else rather
 * than normalising it, so the dialog shows the running total and blocks save
 * until it balances. Values are basis points behind the scenes so 33.33% is
 * exact.
 */
function AllocationEditor({
  category,
  funds,
  onClose,
}: {
  category: OfferingCategory
  funds: Fund[]
  onClose: () => void
}) {
  const qc = useQueryClient()
  const { data: existing, isLoading } = useQuery({
    queryKey: ['allocations', category.id],
    queryFn: () => offeringsApi.allocations(category.id),
  })

  type Row = { fundId: string; pct: string }
  const [rows, setRows] = useState<Row[] | null>(null)
  const current =
    rows ??
    (existing ?? []).map((r): Row => ({
      fundId: r.fundId,
      pct: (r.percentageBps / 100).toString(),
    }))

  const totalPct = current.reduce((a: number, r: Row) => a + (parseFloat(r.pct) || 0), 0)
  const balanced = Math.abs(totalPct - 100) < 0.005
  const hasDuplicate = new Set(current.map((r: Row) => r.fundId)).size !== current.length

  const save = useMutation({
    mutationFn: () =>
      offeringsApi.setAllocations(
        category.id,
        current.map((r: Row) => ({
          fundId: r.fundId,
          percentageBps: Math.round(parseFloat(r.pct) * 100),
        }))
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['allocations', category.id] })
      toast.success(`Allocation saved for ${category.name}`)
      onClose()
    },
    onError: (e: Error) => toast.error(e.message || 'Could not save the allocation'),
  })

  const update = (i: number, patch: Partial<{ fundId: string; pct: string }>) =>
    setRows(current.map((r: Row, j: number) => (j === i ? { ...r, ...patch } : r)))

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" role="dialog" aria-modal="true" aria-label={`Fund allocation for ${category.name}`}>
      <button type="button" className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={onClose} aria-label="Close" />
      <div className={`relative w-full sm:max-w-lg max-h-[85dvh] overflow-y-auto rounded-t-2xl sm:rounded-2xl bg-card border border-border shadow-2xl`}>
        <div className="p-5 border-b border-border">
          <h2 className="font-semibold">Fund allocation</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            How <strong>{category.name}</strong> is split across funds
          </p>
        </div>

        <div className="p-5 space-y-3">
          {isLoading ? (
            <div className="h-24 rounded-xl bg-muted animate-pulse" />
          ) : (
            <>
              {current.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No rules yet — the whole amount goes to the category default fund.
                </p>
              )}
              {current.map((r: Row, i: number) => (
                <div key={i} className="flex gap-2 items-start">
                  <select
                    className={field}
                    value={r.fundId}
                    onChange={(e) => update(i, { fundId: e.target.value })}
                    aria-label={`Fund ${i + 1}`}
                  >
                    <option value="">Select a fund…</option>
                    {funds.map((f) => (
                      <option key={f.id} value={f.id}>{f.name}</option>
                    ))}
                  </select>
                  <div className="relative w-28 shrink-0">
                    <input
                      inputMode="decimal"
                      className={`${field} pr-7 text-right tabular-nums`}
                      value={r.pct}
                      onChange={(e) => update(i, { pct: e.target.value })}
                      aria-label={`Percentage for fund ${i + 1}`}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">%</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setRows(current.filter((_: Row, j: number) => j !== i))}
                    className={btn.ghost}
                    aria-label={`Remove row ${i + 1}`}
                  >
                    <Trash2 className="size-4 text-destructive" aria-hidden />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setRows([...current, { fundId: '', pct: '' }])}
                className={btn.secondary}
              >
                <Plus className="size-4" aria-hidden />
                Add fund
              </button>
            </>
          )}
        </div>

        <div className="p-5 border-t border-border">
          <div className={`rounded-xl border p-3 mb-3 ${balanced ? 'bg-green-100 border-green-200' : 'bg-amber-100 border-amber-200'}`}>
            <p className="text-sm font-medium">
              Total: {totalPct.toFixed(2)}%
              {!balanced && ' — must be exactly 100%'}
            </p>
            {hasDuplicate && (
              <p className="text-xs mt-0.5">Each fund can appear only once.</p>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className={btn.secondary}>Cancel</button>
            <button
              type="button"
              onClick={() => save.mutate()}
              disabled={
                save.isPending ||
                hasDuplicate ||
                current.some((r: Row) => !r.fundId) ||
                (current.length > 0 && !balanced)
              }
              className={btn.primary}
            >
              <Save className="size-4" aria-hidden />
              {save.isPending ? 'Saving…' : 'Save allocation'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
