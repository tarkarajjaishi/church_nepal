'use client'

import { X, Plus, RotateCcw, ArrowUp, ArrowDown } from 'lucide-react'
import {
  FILTER_OPS, isNumeric, type Column, type Filter, type View,
} from '@/lib/reports/api'
import { CARD, btn, field, Label } from '@/components/offerings/ui'

/**
 * Compose a view of the current report: which columns, which rows, what order.
 *
 * Everything here is applied by the server against the report's own output, so
 * a filter behaves identically on all fourteen reports and the export, the
 * PDF and the scheduled email all honour it. A builder whose filters only
 * affected the screen would produce the most convincing wrong spreadsheet in
 * the building.
 */
export function ViewBuilder({
  columns,
  view,
  onChange,
  onClose,
  onSave,
}: {
  columns: Column[]
  view: View
  onChange: (v: View) => void
  onClose: () => void
  onSave: () => void
}) {
  const shown = view.columns.length ? view.columns : columns.map((c) => c.key)

  const toggleColumn = (key: string) => {
    const next = shown.includes(key) ? shown.filter((k) => k !== key) : [...shown, key]
    // Never all-off. An empty column list means "the report's own set" to the
    // server, so unticking the last one would silently restore every column —
    // a control that does the opposite of what it looks like.
    if (!next.length) return
    onChange({ ...view, columns: next })
  }

  const setFilter = (i: number, patch: Partial<Filter>) => {
    const filters = view.filters.map((f, j) => (i === j ? { ...f, ...patch } : f))
    onChange({ ...view, filters })
  }

  const addFilter = () =>
    onChange({
      ...view,
      filters: [...view.filters, { column: columns[0]?.key ?? '', op: 'contains', value: '' }],
    })

  const removeFilter = (i: number) =>
    onChange({ ...view, filters: view.filters.filter((_, j) => j !== i) })

  const kindOf = (key: string) => columns.find((c) => c.key === key)?.kind ?? 'text'

  return (
    <section className={`${CARD} p-4 sm:p-5 mb-4`}>
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h2 className="font-semibold">Build a view</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Applied on the server, so the export, the PDF and any scheduled email match
            what you see here.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onChange({ columns: [], filters: [], sort_column: '', sort_desc: false })}
            className={btn.ghost}
          >
            <RotateCcw className="size-3.5" aria-hidden /> Reset
          </button>
          <button type="button" onClick={onSave} className={btn.primary}>Save as view</button>
          <button type="button" onClick={onClose} className={btn.ghost} aria-label="Close builder">
            <X className="size-4" aria-hidden />
          </button>
        </div>
      </div>

      {/* Columns */}
      <fieldset className="mb-5">
        <legend className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/70 mb-2">
          Columns
        </legend>
        <div className="flex flex-wrap gap-1.5">
          {columns.map((c) => {
            const on = shown.includes(c.key)
            return (
              <button
                key={c.key}
                type="button"
                onClick={() => toggleColumn(c.key)}
                aria-pressed={on}
                className={`min-h-9 px-3 rounded-lg border text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  on
                    ? 'bg-primary/10 border-primary/30 text-primary font-medium'
                    : 'border-border bg-card text-muted-foreground hover:text-foreground'
                }`}
              >
                {c.label}
              </button>
            )
          })}
        </div>
      </fieldset>

      {/* Filters */}
      <fieldset className="mb-5">
        <legend className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/70 mb-2">
          Only show rows where
        </legend>
        {!view.filters.length ? (
          <p className="text-sm text-muted-foreground mb-2">Every row is shown.</p>
        ) : (
          <div className="space-y-2 mb-2">
            {view.filters.map((f, i) => {
              const op = FILTER_OPS.find((o) => o.value === f.op)
              return (
                <div key={i} className="flex flex-wrap items-center gap-2">
                  <select
                    className={`${field} w-auto min-w-[10rem]`}
                    aria-label="Column"
                    value={f.column}
                    onChange={(e) => setFilter(i, { column: e.target.value })}
                  >
                    {columns.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
                  </select>
                  <select
                    className={`${field} w-auto min-w-[9rem]`}
                    aria-label="Condition"
                    value={f.op}
                    onChange={(e) => setFilter(i, { op: e.target.value })}
                  >
                    {FILTER_OPS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                  {op?.needsValue && (
                    <input
                      className={`${field} w-auto min-w-[10rem]`}
                      aria-label="Value"
                      // Money is entered in rupees but compared in paisa, so a
                      // hint rather than a silent conversion — a filter that
                      // quietly multiplied by 100 would be worse.
                      placeholder={kindOf(f.column) === 'money' ? 'in paisa, e.g. 50000 = Rs 500' : ''}
                      value={f.value}
                      onChange={(e) => setFilter(i, { value: e.target.value })}
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => removeFilter(i)}
                    className={btn.ghost}
                    aria-label="Remove this condition"
                  >
                    <X className="size-3.5" aria-hidden />
                  </button>
                </div>
              )
            })}
          </div>
        )}
        <button type="button" onClick={addFilter} className={btn.secondary} disabled={!columns.length}>
          <Plus className="size-4" aria-hidden /> Add a condition
        </button>
      </fieldset>

      {/* Sort */}
      <fieldset>
        <legend className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/70 mb-2">
          Order
        </legend>
        <div className="flex flex-wrap items-end gap-2">
          <div>
            <Label htmlFor="v-sort">Sort by</Label>
            <select
              id="v-sort"
              className={`${field} w-auto min-w-[12rem]`}
              value={view.sort_column}
              onChange={(e) => onChange({ ...view, sort_column: e.target.value })}
            >
              <option value="">The report&apos;s own order</option>
              {columns.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
            </select>
          </div>
          {view.sort_column && (
            <button
              type="button"
              onClick={() => onChange({ ...view, sort_desc: !view.sort_desc })}
              className={btn.secondary}
            >
              {view.sort_desc ? <ArrowDown className="size-4" aria-hidden /> : <ArrowUp className="size-4" aria-hidden />}
              {view.sort_desc
                ? isNumeric(columns.find((c) => c.key === view.sort_column)?.kind ?? 'text')
                  ? 'Largest first'
                  : 'Z to A'
                : isNumeric(columns.find((c) => c.key === view.sort_column)?.kind ?? 'text')
                  ? 'Smallest first'
                  : 'A to Z'}
            </button>
          )}
        </div>
      </fieldset>
    </section>
  )
}
