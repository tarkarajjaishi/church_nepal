'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  Package, Plus, Search, Filter, X, Save, Download,
  ChevronLeft, ChevronRight, ArrowUpDown, ArrowLeftRight, CalendarCheck, Wrench,
} from 'lucide-react'
import {
  assetsApi, ASSET_STATUSES, CONDITIONS, DEPRECIATION_METHODS,
  STATUS_STYLE, CONDITION_STYLE, WARRANTY_STYLE,
  type AssetFilters, type AssetRow,
} from '@/lib/assets/api'
import { money, toMinor } from '@/lib/offerings/api'
import {
  CARD, PageHeader, EmptyState, ErrorState, TableSkeleton, Chip, btn, field, Label,
} from '@/components/offerings/ui'

export default function AssetRegisterPage() {
  return (
    <Suspense fallback={<div className={`${CARD} h-96 animate-pulse`} />}>
      <RegisterInner />
    </Suspense>
  )
}

function RegisterInner() {
  const qc = useQueryClient()
  const params = useSearchParams()
  const [filters, setFilters] = useState<AssetFilters>({ page: 1, perPage: 25 })
  const [showFilters, setShowFilters] = useState(false)
  const [searchDraft, setSearchDraft] = useState('')
  const [creating, setCreating] = useState(false)
  const [detailId, setDetailId] = useState<string | null>(null)

  // Deep link from the dashboard: ?warranty=expiring
  useEffect(() => {
    const w = params.get('warranty')
    if (w) {
      setFilters((f) => ({ ...f, warranty: w, page: 1 }))
      setShowFilters(true)
    }
  }, [params])

  const { data: categories } = useQuery({
    queryKey: ['asset-categories'],
    queryFn: assetsApi.categories,
    staleTime: 300_000,
  })
  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['assets', filters],
    queryFn: () => assetsApi.list(filters),
    placeholderData: (p) => p,
  })

  const patch = (p: Partial<AssetFilters>) => setFilters((f) => ({ ...f, ...p, page: p.page ?? 1 }))
  const clear = () => { setFilters({ page: 1, perPage: filters.perPage }); setSearchDraft('') }

  const activeFilters = (['categoryId', 'status', 'condition', 'building', 'warranty', 'search', 'reservable'] as const)
    .filter((k) => filters[k] !== undefined && filters[k] !== '').length

  const toggleSort = (key: string) =>
    setFilters((f) => ({ ...f, sort: key, dir: f.sort === key && f.dir === 'desc' ? 'asc' : 'desc', page: 1 }))

  const exportCsv = () => {
    const rows = data?.data ?? []
    if (!rows.length) return toast.info('Nothing to export')
    const head = ['Code', 'Name', 'Category', 'Serial', 'Manufacturer', 'Model',
      'Purchased', 'Cost', 'Current Value', 'Depreciation', 'Condition', 'Status', 'Location', 'Warranty']
    // Prefix formula characters so a spreadsheet cannot execute supplier text.
    const cell = (v: unknown) => {
      const s = String(v ?? '')
      return `"${(/^[=+\-@]/.test(s) ? `'${s}` : s).replace(/"/g, '""')}"`
    }
    const csv = [
      head.join(','),
      ...rows.map((a) => [
        a.assetCode, a.name, a.categoryName ?? '', a.serialNumber, a.manufacturer, a.model,
        a.purchaseDate ?? '', (a.purchaseCost / 100).toFixed(2), (a.currentValue / 100).toFixed(2),
        (a.accumulatedDepreciation / 100).toFixed(2), a.condition, a.status,
        [a.building, a.room].filter(Boolean).join(' / '), a.warrantyExpires ?? '',
      ].map(cell).join(',')),
    ].join('\r\n')
    const url = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }))
    const link = document.createElement('a')
    link.href = url
    link.download = `assets-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
    toast.success(`Exported ${rows.length} asset${rows.length === 1 ? '' : 's'}`)
  }

  const rows = data?.data ?? []

  return (
    <>
      <PageHeader
        title="Asset Register"
        subtitle={
          data
            ? `${data.total} asset${data.total === 1 ? '' : 's'} · ${money(data.filteredCost, { compact: true })} cost · ${money(data.filteredCurrentValue, { compact: true })} current value`
            : undefined
        }
        actions={
          <>
            <button type="button" onClick={exportCsv} className={btn.secondary}>
              <Download className="size-4" aria-hidden /> Export
            </button>
            <button type="button" onClick={() => setCreating(true)} className={btn.primary}>
              <Plus className="size-4" aria-hidden /> Add Asset
            </button>
          </>
        }
      />

      <div className={`${CARD} p-3 sm:p-4 mb-4`}>
        <div className="flex flex-wrap items-center gap-2">
          <form
            className="relative flex-1 min-w-[14rem]"
            onSubmit={(e) => { e.preventDefault(); patch({ search: searchDraft || undefined }) }}
          >
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" aria-hidden />
            <input
              type="search"
              value={searchDraft}
              onChange={(e) => setSearchDraft(e.target.value)}
              placeholder="Search name, code, serial, model or room…"
              aria-label="Search assets"
              className={`${field} pl-9`}
            />
          </form>
          <button type="button" onClick={() => setShowFilters((v) => !v)} aria-expanded={showFilters} className={btn.secondary}>
            <Filter className="size-4" aria-hidden />
            Filters
            {activeFilters > 0 && (
              <span className="ml-0.5 inline-flex items-center justify-center min-w-5 h-5 px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-semibold tabular-nums">
                {activeFilters}
              </span>
            )}
          </button>
          {activeFilters > 0 && (
            <button type="button" onClick={clear} className={btn.ghost}>
              <X className="size-4" aria-hidden /> Clear
            </button>
          )}
        </div>

        {showFilters && (
          <div className="mt-4 pt-4 border-t border-border grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label htmlFor="f-cat" className="block text-xs font-medium text-muted-foreground mb-1">Category</label>
              <select id="f-cat" className={field} value={filters.categoryId ?? ''} onChange={(e) => patch({ categoryId: e.target.value || undefined })}>
                <option value="">All categories</option>
                {(categories ?? []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="f-status" className="block text-xs font-medium text-muted-foreground mb-1">Status</label>
              <select id="f-status" className={field} value={filters.status ?? ''} onChange={(e) => patch({ status: e.target.value || undefined })}>
                <option value="">All statuses</option>
                {ASSET_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="f-cond" className="block text-xs font-medium text-muted-foreground mb-1">Condition</label>
              <select id="f-cond" className={field} value={filters.condition ?? ''} onChange={(e) => patch({ condition: e.target.value || undefined })}>
                <option value="">Any condition</option>
                {CONDITIONS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="f-warr" className="block text-xs font-medium text-muted-foreground mb-1">Warranty</label>
              <select id="f-warr" className={field} value={filters.warranty ?? ''} onChange={(e) => patch({ warranty: e.target.value || undefined })}>
                <option value="">Any</option>
                <option value="active">Active</option>
                <option value="expiring">Expiring (60 days)</option>
                <option value="expired">Expired</option>
                <option value="none">No warranty</option>
              </select>
            </div>
          </div>
        )}
      </div>

      <div className={`${CARD} overflow-hidden`}>
        {isError ? (
          <ErrorState message={(error as Error)?.message} onRetry={() => refetch()} />
        ) : isLoading ? (
          <TableSkeleton cols={7} />
        ) : !rows.length ? (
          <EmptyState
            icon={Package}
            title={activeFilters ? 'No assets match these filters' : 'No assets registered'}
            subtitle={activeFilters ? 'Try clearing a filter.' : 'Register the church inventory to track value and upkeep.'}
            action={
              activeFilters
                ? <button type="button" onClick={clear} className={btn.secondary}>Clear filters</button>
                : <button type="button" onClick={() => setCreating(true)} className={btn.primary}>Add Asset</button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10 bg-card/95 backdrop-blur border-b border-border">
                <tr>
                  {[
                    { k: 'code', l: 'Code' }, { k: 'name', l: 'Asset' }, { k: 'category', l: 'Category' },
                    { k: null, l: 'Location' }, { k: 'cost', l: 'Cost', r: true },
                    { k: null, l: 'Current', r: true }, { k: null, l: 'Condition' },
                    { k: 'status', l: 'Status' }, { k: null, l: 'Warranty' },
                  ].map((c) => (
                    <th key={c.l} scope="col" className={`px-3 py-3 font-medium text-muted-foreground whitespace-nowrap ${c.r ? 'text-right' : 'text-left'}`}>
                      {c.k ? (
                        <button type="button" onClick={() => toggleSort(c.k!)} className="inline-flex items-center gap-1 hover:text-foreground transition-colors rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label={`Sort by ${c.l}`}>
                          {c.l}
                          <ArrowUpDown className={`size-3 ${filters.sort === c.k ? 'text-primary' : 'opacity-40'}`} aria-hidden />
                        </button>
                      ) : c.l}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className={isFetching ? 'opacity-60 transition-opacity' : ''}>
                {rows.map((a) => (
                  <tr key={a.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                    <td className="px-3 py-3 font-mono text-xs whitespace-nowrap">{a.assetCode}</td>
                    <td className="px-3 py-3">
                      <button type="button" onClick={() => setDetailId(a.id)} className="font-medium text-left hover:text-primary transition-colors rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                        {a.name}
                      </button>
                      {a.assignedTo && <p className="text-xs text-muted-foreground">with {a.assignedTo}</p>}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      {a.categoryName ? (
                        <Chip className="bg-muted text-foreground border-border" dot={a.categoryColor}>{a.categoryName}</Chip>
                      ) : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="px-3 py-3 text-muted-foreground text-xs max-w-[10rem] truncate">
                      {[a.building, a.room].filter(Boolean).join(' / ') || '—'}
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums whitespace-nowrap">{money(a.purchaseCost)}</td>
                    <td className="px-3 py-3 text-right tabular-nums font-medium whitespace-nowrap">{money(a.currentValue)}</td>
                    <td className="px-3 py-3">
                      <Chip className={CONDITION_STYLE[a.condition] ?? CONDITION_STYLE.good}>{a.condition}</Chip>
                    </td>
                    <td className="px-3 py-3">
                      <Chip className={STATUS_STYLE[a.status] ?? STATUS_STYLE.available}>{a.status}</Chip>
                    </td>
                    <td className="px-3 py-3">
                      {a.warrantyStatus === 'none' ? (
                        <span className="text-muted-foreground text-xs">—</span>
                      ) : (
                        <Chip className={WARRANTY_STYLE[a.warrantyStatus] ?? WARRANTY_STYLE.none}>
                          {a.warrantyStatus}
                        </Chip>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {data && data.totalPages > 1 && (
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-t border-border">
            <p className="text-xs text-muted-foreground tabular-nums">
              Page {data.page} of {data.totalPages} · {data.total} assets
            </p>
            <div className="flex items-center gap-1">
              <button type="button" disabled={data.page <= 1} onClick={() => setFilters((f) => ({ ...f, page: (f.page ?? 1) - 1 }))} className={btn.secondary} aria-label="Previous page">
                <ChevronLeft className="size-4" aria-hidden />
              </button>
              <button type="button" disabled={data.page >= data.totalPages} onClick={() => setFilters((f) => ({ ...f, page: (f.page ?? 1) + 1 }))} className={btn.secondary} aria-label="Next page">
                <ChevronRight className="size-4" aria-hidden />
              </button>
            </div>
          </div>
        )}
      </div>

      {creating && (
        <AssetEditor
          categories={categories ?? []}
          onClose={() => setCreating(false)}
          onSaved={() => { qc.invalidateQueries({ queryKey: ['assets'] }); qc.invalidateQueries({ queryKey: ['asset-dashboard'] }); setCreating(false) }}
        />
      )}
      {detailId && <AssetDetailPanel id={detailId} onClose={() => setDetailId(null)} />}
    </>
  )
}

function AssetEditor({
  categories,
  onClose,
  onSaved,
}: {
  categories: { id: string; name: string; defaultUsefulLifeYears: number; isReservable: boolean }[]
  onClose: () => void
  onSaved: () => void
}) {
  const [f, setF] = useState({
    name: '', categoryId: '', serialNumber: '', manufacturer: '', model: '',
    purchaseDate: '', purchaseCost: '', salvageValue: '', depreciationMethod: 'straight_line',
    usefulLifeYears: '', warrantyExpires: '', building: '', room: '',
    condition: 'good', isReservable: false, notes: '',
  })
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((s) => ({ ...s, [k]: v }))

  // Picking a category fills its default life and reservability, so common
  // cases need no extra typing.
  const onCategory = (id: string) => {
    const c = categories.find((x) => x.id === id)
    setF((s) => ({
      ...s,
      categoryId: id,
      usefulLifeYears: c ? String(c.defaultUsefulLifeYears) : s.usefulLifeYears,
      isReservable: c ? c.isReservable : s.isReservable,
    }))
  }

  const cost = toMinor(f.purchaseCost)
  const salvage = f.salvageValue ? toMinor(f.salvageValue) : 0

  const save = useMutation({
    mutationFn: () =>
      assetsApi.create({
        name: f.name.trim(),
        category_id: f.categoryId || undefined,
        serial_number: f.serialNumber.trim(),
        manufacturer: f.manufacturer.trim(),
        model: f.model.trim(),
        purchase_date: f.purchaseDate || null,
        purchase_cost: cost ?? 0,
        salvage_value: salvage ?? 0,
        depreciation_method: f.depreciationMethod,
        useful_life_years: f.usefulLifeYears ? Number(f.usefulLifeYears) : undefined,
        warranty_expires: f.warrantyExpires || null,
        building: f.building.trim(),
        room: f.room.trim(),
        condition: f.condition,
        is_reservable: f.isReservable,
        notes: f.notes.trim(),
      }),
    // The response interceptor camelCases every key, so `asset_code` is always
    // undefined and the toast silently drops the code it was written to show.
    onSuccess: (res: { assetCode?: string }) => {
      toast.success(`Asset registered${res.assetCode ? ` as ${res.assetCode}` : ''}`)
      onSaved()
    },
    onError: (e: Error) => toast.error(e.message || 'Could not register this asset'),
  })

  const valid =
    f.name.trim().length > 0 &&
    (f.purchaseCost === '' || cost !== null) &&
    (salvage ?? 0) <= (cost ?? 0)

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" role="dialog" aria-modal="true" aria-label="Add asset">
      <button type="button" className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={onClose} aria-label="Close" />
      <div className="relative w-full sm:max-w-2xl max-h-[90dvh] overflow-y-auto rounded-t-2xl sm:rounded-2xl bg-card border border-border shadow-2xl">
        <div className="sticky top-0 z-10 bg-card/95 backdrop-blur p-5 border-b border-border flex items-center justify-between">
          <h2 className="font-semibold">Register an asset</h2>
          <button type="button" onClick={onClose} className={btn.ghost} aria-label="Close"><X className="size-4" aria-hidden /></button>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); if (valid) save.mutate() }} className="p-5 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="a-name" required>Asset name</Label>
              <input id="a-name" className={field} value={f.name} onChange={(e) => set('name', e.target.value)} placeholder="Yamaha Stage Piano" />
            </div>
            <div>
              <Label htmlFor="a-cat">Category</Label>
              <select id="a-cat" className={field} value={f.categoryId} onChange={(e) => onCategory(e.target.value)}>
                <option value="">Uncategorised</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <Label htmlFor="a-serial" hint="Must be unique when given">Serial number</Label>
              <input id="a-serial" className={field} value={f.serialNumber} onChange={(e) => set('serialNumber', e.target.value)} />
            </div>
            <div><Label htmlFor="a-manu">Manufacturer</Label><input id="a-manu" className={field} value={f.manufacturer} onChange={(e) => set('manufacturer', e.target.value)} /></div>
            <div><Label htmlFor="a-model">Model</Label><input id="a-model" className={field} value={f.model} onChange={(e) => set('model', e.target.value)} /></div>
            <div><Label htmlFor="a-date">Purchase date</Label><input id="a-date" type="date" className={field} value={f.purchaseDate} onChange={(e) => set('purchaseDate', e.target.value)} /></div>
            <div>
              <Label htmlFor="a-cost">Purchase cost</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">Rs</span>
                <input id="a-cost" inputMode="decimal" className={`${field} pl-9 text-right tabular-nums`} placeholder="0.00" value={f.purchaseCost} onChange={(e) => set('purchaseCost', e.target.value)} />
              </div>
            </div>
            <div>
              <Label htmlFor="a-method">Depreciation</Label>
              <select id="a-method" className={field} value={f.depreciationMethod} onChange={(e) => set('depreciationMethod', e.target.value)}>
                {DEPRECIATION_METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
            <div>
              <Label htmlFor="a-life" hint="Years">Useful life</Label>
              <input id="a-life" inputMode="numeric" className={field} value={f.usefulLifeYears} onChange={(e) => set('usefulLifeYears', e.target.value.replace(/[^\d]/g, ''))} placeholder="5" />
            </div>
            <div>
              <Label htmlFor="a-salvage" hint="Value at end of life">Salvage value</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">Rs</span>
                <input id="a-salvage" inputMode="decimal" className={`${field} pl-9 text-right tabular-nums`} placeholder="0.00" value={f.salvageValue} onChange={(e) => set('salvageValue', e.target.value)} />
              </div>
              {(salvage ?? 0) > (cost ?? 0) && (
                <p role="alert" className="mt-1 text-xs text-destructive">Salvage cannot exceed the purchase cost.</p>
              )}
            </div>
            <div><Label htmlFor="a-warr">Warranty expires</Label><input id="a-warr" type="date" className={field} value={f.warrantyExpires} onChange={(e) => set('warrantyExpires', e.target.value)} /></div>
            <div><Label htmlFor="a-bldg">Building</Label><input id="a-bldg" className={field} value={f.building} onChange={(e) => set('building', e.target.value)} /></div>
            <div><Label htmlFor="a-room">Room</Label><input id="a-room" className={field} value={f.room} onChange={(e) => set('room', e.target.value)} /></div>
            <div>
              <Label htmlFor="a-cond">Condition</Label>
              <select id="a-cond" className={field} value={f.condition} onChange={(e) => set('condition', e.target.value)}>
                {CONDITIONS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <label className="inline-flex items-center gap-2 cursor-pointer text-sm">
            <input type="checkbox" checked={f.isReservable} onChange={(e) => set('isReservable', e.target.checked)} className="size-4 rounded border-border accent-[var(--church-blue)]" />
            Can be booked out by ministries
          </label>

          <div><Label htmlFor="a-notes">Notes</Label><textarea id="a-notes" rows={2} className={`${field} py-2 resize-y`} value={f.notes} onChange={(e) => set('notes', e.target.value)} /></div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className={btn.secondary}>Cancel</button>
            <button type="submit" disabled={!valid || save.isPending} className={btn.primary}>
              <Save className="size-4" aria-hidden />
              {save.isPending ? 'Saving…' : 'Register asset'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function AssetDetailPanel({ id, onClose }: { id: string; onClose: () => void }) {
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({ queryKey: ['asset', id], queryFn: () => assetsApi.get(id) })
  const [who, setWho] = useState('')

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['asset', id] })
    qc.invalidateQueries({ queryKey: ['assets'] })
    qc.invalidateQueries({ queryKey: ['asset-dashboard'] })
  }

  const assign = useMutation({
    mutationFn: () => assetsApi.assign(id, { assigned_to: who.trim() }),
    onSuccess: () => { invalidate(); setWho(''); toast.success('Checked out') },
    onError: (e: Error) => toast.error(e.message),
  })
  const ret = useMutation({
    mutationFn: (assignmentId: string) => assetsApi.returnAssignment(assignmentId, {}),
    onSuccess: () => { invalidate(); toast.success('Returned') },
    onError: (e: Error) => toast.error(e.message),
  })

  const open = data?.assignments.find((g) => !g.returnedAt)

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" role="dialog" aria-modal="true" aria-label="Asset detail">
      <button type="button" className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={onClose} aria-label="Close" />
      <div className="relative w-full sm:max-w-2xl max-h-[90dvh] overflow-y-auto rounded-t-2xl sm:rounded-2xl bg-card border border-border shadow-2xl">
        {isLoading || !data ? (
          <div className="p-6"><div className="h-64 rounded-xl bg-muted animate-pulse" /></div>
        ) : (
          <>
            <div className="sticky top-0 z-10 bg-card/95 backdrop-blur p-5 border-b border-border flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="font-semibold truncate">{data.asset.name}</h2>
                <p className="text-xs text-muted-foreground font-mono">{data.asset.assetCode}</p>
              </div>
              <button type="button" onClick={onClose} className={btn.ghost} aria-label="Close"><X className="size-4" aria-hidden /></button>
            </div>

            <div className="p-5 space-y-5">
              <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  ['Cost', money(data.asset.purchaseCost)],
                  ['Current value', money(data.asset.currentValue)],
                  ['Depreciated', money(data.asset.accumulatedDepreciation)],
                  ['Upkeep spent', money(data.maintenanceCostTotal)],
                ].map(([k, v]) => (
                  <div key={k} className="rounded-xl bg-muted p-3">
                    <dt className="text-xs text-muted-foreground">{k}</dt>
                    <dd className="font-semibold tabular-nums text-sm mt-0.5">{v}</dd>
                  </div>
                ))}
              </dl>

              <div className="flex flex-wrap gap-2">
                <Chip className={STATUS_STYLE[data.asset.status]}>{data.asset.status}</Chip>
                <Chip className={CONDITION_STYLE[data.asset.condition]}>{data.asset.condition}</Chip>
                {data.asset.warrantyStatus !== 'none' && (
                  <Chip className={WARRANTY_STYLE[data.asset.warrantyStatus]}>
                    warranty {data.asset.warrantyStatus}
                  </Chip>
                )}
                {data.asset.isReservable && <Chip className="bg-muted text-foreground border-border">bookable</Chip>}
              </div>

              <section>
                <h3 className="text-sm font-semibold mb-2 inline-flex items-center gap-1.5">
                  <ArrowLeftRight className="size-3.5" aria-hidden /> Check-out
                </h3>
                {open ? (
                  <div className="flex items-center justify-between gap-3 rounded-xl border border-border p-3">
                    <div className="min-w-0">
                      <p className="text-sm">With <strong>{open.assignedTo}</strong></p>
                      <p className="text-xs text-muted-foreground">
                        Since {open.assignedAt}{open.dueBack && ` · due ${open.dueBack}`}
                      </p>
                    </div>
                    <button type="button" onClick={() => ret.mutate(open.id)} disabled={ret.isPending} className={btn.secondary}>
                      Record return
                    </button>
                  </div>
                ) : (
                  <form onSubmit={(e) => { e.preventDefault(); if (who.trim()) assign.mutate() }} className="flex gap-2">
                    <input className={field} placeholder="Who is taking it?" value={who} onChange={(e) => setWho(e.target.value)} aria-label="Assign to" />
                    <button type="submit" disabled={!who.trim() || assign.isPending} className={btn.primary}>Check out</button>
                  </form>
                )}
              </section>

              {data.maintenance.length > 0 && (
                <section>
                  <h3 className="text-sm font-semibold mb-2 inline-flex items-center gap-1.5">
                    <Wrench className="size-3.5" aria-hidden /> Maintenance history
                  </h3>
                  <ul className="divide-y divide-border rounded-xl border border-border">
                    {data.maintenance.slice(0, 6).map((m) => (
                      <li key={m.id} className="flex items-center justify-between gap-3 px-3 py-2">
                        <div className="min-w-0">
                          <p className="text-sm truncate">{m.title || m.maintenanceKind}</p>
                          <p className="text-xs text-muted-foreground">
                            {m.performedOn ?? m.scheduledFor ?? '—'} · {m.status}
                            {m.technician && ` · ${m.technician}`}
                          </p>
                        </div>
                        <span className="text-sm tabular-nums shrink-0">{money(m.cost)}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {data.reservations.length > 0 && (
                <section>
                  <h3 className="text-sm font-semibold mb-2 inline-flex items-center gap-1.5">
                    <CalendarCheck className="size-3.5" aria-hidden /> Bookings
                  </h3>
                  <ul className="divide-y divide-border rounded-xl border border-border">
                    {data.reservations.slice(0, 6).map((r) => (
                      <li key={r.id} className="flex items-center justify-between gap-3 px-3 py-2">
                        <div className="min-w-0">
                          <p className="text-sm truncate">{r.requestedBy}</p>
                          <p className="text-xs text-muted-foreground">{r.startsOn} → {r.endsOn}</p>
                        </div>
                        <Chip className={STATUS_STYLE[r.status] ?? 'bg-muted text-foreground border-border'}>{r.status}</Chip>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
