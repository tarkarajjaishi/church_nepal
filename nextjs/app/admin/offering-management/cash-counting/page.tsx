'use client'

import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  Calculator,
  Lock,
  Printer,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react'
import {
  offeringsApi,
  money,
  toMinor,
  DENOMINATIONS,
  type CashCount,
} from '@/lib/offerings/api'
import {
  CARD,
  PageHeader,
  EmptyState,
  Chip,
  btn,
  field,
  Label,
} from '@/components/offerings/ui'

const SERVICES = [
  'Sunday First Service',
  'Sunday Second Service',
  'Wednesday Prayer',
  'Friday Youth Service',
  'Saturday Fellowship',
]

export default function CashCountingPage() {
  const qc = useQueryClient()
  const today = new Date().toISOString().slice(0, 10)

  const [meta, setMeta] = useState({
    countDate: today,
    serviceName: SERVICES[0],
    counterOne: '',
    counterTwo: '',
    supervisor: '',
    expected: '',
    varianceReason: '',
    notes: '',
  })
  // Quantities keyed by denomination in minor units.
  const [qty, setQty] = useState<Record<number, string>>({})
  const [coins, setCoins] = useState('')

  const setMetaField = <K extends keyof typeof meta>(k: K, v: (typeof meta)[K]) =>
    setMeta((m) => ({ ...m, [k]: v }))

  const { data: recent } = useQuery({
    queryKey: ['cash-counts'],
    queryFn: offeringsApi.cashCounts,
  })

  // Totals are recomputed here for instant feedback, but the server recomputes
  // them on save and its value is what is stored — the browser is never the
  // authority on the counted figure.
  const lines = useMemo(
    () =>
      DENOMINATIONS.map((d) => {
        const q = parseInt(qty[d.minor] || '0', 10)
        const n = Number.isFinite(q) && q > 0 ? q : 0
        return { ...d, quantity: n, subtotal: d.minor * n }
      }),
    [qty]
  )

  const notesTotal = lines.filter((l) => l.kind === 'note').reduce((a, l) => a + l.subtotal, 0)
  const coinsTotal = lines.filter((l) => l.kind === 'coin').reduce((a, l) => a + l.subtotal, 0)
  const looseCoins = toMinor(coins) ?? 0
  const countedTotal = notesTotal + coinsTotal + looseCoins
  const expectedMinor = toMinor(meta.expected)
  const variance = expectedMinor === null ? null : countedTotal - expectedMinor
  const needsReason = variance !== null && variance !== 0

  const totalPieces = lines.reduce((a, l) => a + l.quantity, 0)

  const save = useMutation({
    mutationFn: () =>
      offeringsApi.saveCashCount({
        count_date: meta.countDate,
        service_name: meta.serviceName,
        counter_one: meta.counterOne.trim(),
        counter_two: meta.counterTwo.trim(),
        supervisor: meta.supervisor.trim(),
        expected_total: expectedMinor ?? 0,
        variance_reason: meta.varianceReason.trim(),
        notes: meta.notes.trim(),
        lines: [
          ...lines
            .filter((l) => l.quantity > 0)
            .map((l) => ({
              denomination: l.minor,
              label: `Rs ${l.label}`,
              quantity: l.quantity,
              counted_by: 'one',
            })),
          // Loose coins ride on denomination 0 with quantity 1 so the stored
          // subtotal equals the amount; the schema reserves 0 for this.
          ...(looseCoins > 0
            ? [{ denomination: 0, label: 'Mixed coins', quantity: 1, counted_by: 'one' }]
            : []),
        ],
      }),
    onSuccess: (res: CashCount) => {
      qc.invalidateQueries({ queryKey: ['cash-counts'] })
      toast.success(
        res.variance === 0
          ? `Count saved and balanced at ${money(res.countedTotal)}`
          : `Count saved with a ${money(Math.abs(res.variance))} ${res.variance > 0 ? 'surplus' : 'shortfall'}`
      )
    },
    onError: (e: Error) => toast.error(e.message || 'Could not save this count'),
  })

  const approve = useMutation({
    mutationFn: (id: string) => offeringsApi.approveCashCount(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cash-counts'] })
      qc.invalidateQueries({ queryKey: ['offering-dashboard'] })
      toast.success('Count approved and locked')
    },
    onError: (e: Error) => toast.error(e.message || 'Could not approve this count'),
  })

  const reset = () => {
    setQty({})
    setCoins('')
    setMeta((m) => ({ ...m, expected: '', varianceReason: '', notes: '' }))
  }

  const canSave =
    countedTotal > 0 &&
    meta.counterOne.trim().length > 0 &&
    (!needsReason || meta.varianceReason.trim().length > 0)

  return (
    <>
      <PageHeader
        title="Cash Counting"
        subtitle="Two counters and a supervisor. Totals are calculated as you type."
        actions={
          <>
            <button type="button" onClick={reset} className={btn.secondary}>
              <RotateCcw className="size-4" aria-hidden />
              Reset
            </button>
            <button type="button" onClick={() => window.print()} className={btn.secondary}>
              <Printer className="size-4" aria-hidden />
              Print
            </button>
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          {/* Who counted */}
          <section className={`${CARD} p-4 sm:p-5`}>
            <h2 className="font-semibold mb-4">Counting session</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="cc-date">Date</Label>
                <input id="cc-date" type="date" max={today} className={field} value={meta.countDate} onChange={(e) => setMetaField('countDate', e.target.value)} />
              </div>
              <div>
                <Label htmlFor="cc-service">Service</Label>
                <select id="cc-service" className={field} value={meta.serviceName} onChange={(e) => setMetaField('serviceName', e.target.value)}>
                  {SERVICES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <Label htmlFor="cc-one" required>Counter one</Label>
                <input id="cc-one" className={field} placeholder="Name" value={meta.counterOne} onChange={(e) => setMetaField('counterOne', e.target.value)} />
              </div>
              <div>
                <Label htmlFor="cc-two">Counter two</Label>
                <input id="cc-two" className={field} placeholder="Name" value={meta.counterTwo} onChange={(e) => setMetaField('counterTwo', e.target.value)} />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="cc-sup" hint="Signs off and locks the count">Supervisor</Label>
                <input id="cc-sup" className={field} placeholder="Name" value={meta.supervisor} onChange={(e) => setMetaField('supervisor', e.target.value)} />
              </div>
            </div>
          </section>

          {/* Denominations */}
          <section className={`${CARD} overflow-hidden`}>
            <div className="p-4 sm:p-5 border-b border-border">
              <h2 className="font-semibold">Denominations</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Enter how many of each note or coin. {totalPieces.toLocaleString()} pieces counted.
              </p>
            </div>
            <table className="w-full text-sm">
              <caption className="sr-only">Cash denomination tally</caption>
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th scope="col" className="text-left px-4 py-2 font-medium text-muted-foreground">Denomination</th>
                  <th scope="col" className="text-right px-4 py-2 font-medium text-muted-foreground w-32">Quantity</th>
                  <th scope="col" className="text-right px-4 py-2 font-medium text-muted-foreground w-40">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {lines.map((l) => (
                  <tr key={l.minor} className="border-b border-border last:border-0">
                    <th scope="row" className="text-left px-4 py-2 font-normal">
                      <span className="inline-flex items-center gap-2">
                        <span className="font-medium tabular-nums">Rs {l.label}</span>
                        <Chip className="bg-muted text-muted-foreground border-border">
                          {l.kind}
                        </Chip>
                      </span>
                    </th>
                    <td className="px-4 py-2">
                      <input
                        type="text"
                        inputMode="numeric"
                        aria-label={`Quantity of Rs ${l.label}`}
                        className={`${field} text-right tabular-nums`}
                        placeholder="0"
                        value={qty[l.minor] ?? ''}
                        onChange={(e) => {
                          const v = e.target.value.replace(/[^\d]/g, '')
                          setQty((q) => ({ ...q, [l.minor]: v }))
                        }}
                      />
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums font-medium">
                      {l.subtotal > 0 ? money(l.subtotal) : <span className="text-muted-foreground">—</span>}
                    </td>
                  </tr>
                ))}
                <tr className="border-b border-border">
                  <th scope="row" className="text-left px-4 py-2 font-normal">
                    <span className="font-medium">Mixed coins</span>
                    <span className="block text-xs text-muted-foreground">Enter a total instead of a count</span>
                  </th>
                  <td className="px-4 py-2 text-right text-xs text-muted-foreground">—</td>
                  <td className="px-4 py-2">
                    <input
                      inputMode="decimal"
                      aria-label="Mixed coins total"
                      className={`${field} text-right tabular-nums`}
                      placeholder="0.00"
                      value={coins}
                      onChange={(e) => setCoins(e.target.value)}
                    />
                  </td>
                </tr>
              </tbody>
              <tfoot className="bg-muted/50">
                <tr>
                  <th scope="row" className="text-left px-4 py-3 font-semibold">Counted total</th>
                  <td className="px-4 py-3 text-right text-xs text-muted-foreground tabular-nums">
                    {totalPieces.toLocaleString()} pcs
                  </td>
                  <td className="px-4 py-3 text-right font-semibold tabular-nums text-base">
                    {money(countedTotal)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </section>
        </div>

        {/* Reconciliation rail */}
        <aside className="space-y-4">
          <div className={`${CARD} p-4 sm:p-5 lg:sticky lg:top-4`}>
            <h2 className="font-semibold mb-3">Reconciliation</h2>

            <Label htmlFor="cc-expected" hint="From the envelopes or the offering record">
              Expected total
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">Rs</span>
              <input
                id="cc-expected"
                inputMode="decimal"
                className={`${field} pl-9 text-right tabular-nums`}
                placeholder="0.00"
                value={meta.expected}
                onChange={(e) => setMetaField('expected', e.target.value)}
              />
            </div>

            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Notes</dt>
                <dd className="tabular-nums">{money(notesTotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Coins</dt>
                <dd className="tabular-nums">{money(coinsTotal + looseCoins)}</dd>
              </div>
              <div className="flex justify-between pt-2 border-t border-border">
                <dt className="font-medium">Counted</dt>
                <dd className="font-semibold tabular-nums">{money(countedTotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Expected</dt>
                <dd className="tabular-nums">
                  {expectedMinor === null ? '—' : money(expectedMinor)}
                </dd>
              </div>
            </dl>

            {/* Variance banner — the whole point of the screen */}
            <div
              className={`mt-4 rounded-xl border p-3 ${
                variance === null
                  ? 'bg-muted border-border'
                  : variance === 0
                    ? 'bg-green-100 border-green-200'
                    : 'bg-red-100 border-red-200'
              }`}
              role={needsReason ? 'alert' : undefined}
            >
              <div className="flex items-start gap-2">
                {variance === null ? (
                  <Calculator className="size-4 mt-0.5 text-muted-foreground shrink-0" aria-hidden />
                ) : variance === 0 ? (
                  <CheckCircle2 className="size-4 mt-0.5 text-green-700 shrink-0" aria-hidden />
                ) : (
                  <AlertTriangle className="size-4 mt-0.5 text-red-700 shrink-0" aria-hidden />
                )}
                <div className="min-w-0">
                  <p className="text-sm font-medium">
                    {variance === null
                      ? 'Enter an expected total to check'
                      : variance === 0
                        ? 'Balanced'
                        : `${variance > 0 ? 'Surplus' : 'Shortfall'} of ${money(Math.abs(variance))}`}
                  </p>
                  {needsReason && (
                    <p className="text-xs mt-0.5">
                      A written reason is required before this count can be approved.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {needsReason && (
              <div className="mt-3">
                <Label htmlFor="cc-reason" required>Variance reason</Label>
                <textarea
                  id="cc-reason"
                  rows={3}
                  className={`${field} py-2 resize-y`}
                  placeholder="Explain the difference"
                  value={meta.varianceReason}
                  onChange={(e) => setMetaField('varianceReason', e.target.value)}
                />
              </div>
            )}

            <button
              type="button"
              onClick={() => save.mutate()}
              disabled={!canSave || save.isPending}
              className={`${btn.primary} w-full mt-4`}
            >
              <Calculator className="size-4" aria-hidden />
              {save.isPending ? 'Saving…' : 'Save count'}
            </button>
            {!canSave && countedTotal > 0 && (
              <p className="mt-2 text-xs text-muted-foreground">
                {meta.counterOne.trim() ? 'Explain the variance to continue.' : 'Name counter one to continue.'}
              </p>
            )}
          </div>
        </aside>
      </div>

      {/* Recent sessions */}
      <section className={`${CARD} mt-4 overflow-hidden`}>
        <div className="p-4 sm:p-5 border-b border-border">
          <h2 className="font-semibold">Recent counts</h2>
        </div>
        {!recent?.length ? (
          <EmptyState
            icon={Calculator}
            title="No counts recorded yet"
            subtitle="Saved counting sessions appear here for approval."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  {['Date', 'Service', 'Counters', 'Counted', 'Variance', 'Status', ''].map((h) => (
                    <th key={h} scope="col" className="text-left px-4 py-2 font-medium text-muted-foreground whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recent.slice(0, 15).map((c) => (
                  <tr key={c.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap">{c.countDate}</td>
                    <td className="px-4 py-3 max-w-[12rem] truncate" title={c.serviceName}>{c.serviceName || '—'}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground max-w-[14rem] truncate">
                      {[c.counterOne, c.counterTwo].filter(Boolean).join(', ') || '—'}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums font-medium whitespace-nowrap">{money(c.countedTotal)}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {c.variance === 0 ? (
                        <Chip className="bg-green-100 text-green-800 border-green-200">Balanced</Chip>
                      ) : (
                        <Chip className="bg-red-100 text-red-800 border-red-200">
                          {c.variance > 0 ? '+' : '−'}{money(Math.abs(c.variance))}
                        </Chip>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {c.isLocked ? (
                        <Chip className="bg-muted text-foreground border-border">
                          <Lock className="size-3" aria-hidden /> Locked
                        </Chip>
                      ) : (
                        <Chip className="bg-amber-100 text-amber-800 border-amber-200">Open</Chip>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {!c.isLocked && (
                        <button
                          type="button"
                          onClick={() => approve.mutate(c.id)}
                          disabled={approve.isPending}
                          className={btn.secondary}
                        >
                          <Lock className="size-3.5" aria-hidden />
                          Approve &amp; lock
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  )
}
