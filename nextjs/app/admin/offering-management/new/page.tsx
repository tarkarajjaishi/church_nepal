'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Save, Send, EyeOff, Info } from 'lucide-react'
import {
  offeringsApi,
  money,
  toMinor,
  PAYMENT_METHODS,
} from '@/lib/offerings/api'
import { CARD, PageHeader, btn, field, Label } from '@/components/offerings/ui'

const SERVICES = [
  'Sunday First Service',
  'Sunday Second Service',
  'Wednesday Prayer',
  'Friday Youth Service',
  'Saturday Fellowship',
  'Special Service',
]

const GIVER_TYPES = [
  { value: 'member', label: 'Member' },
  { value: 'visitor', label: 'Visitor' },
  { value: 'guest', label: 'Guest' },
]

/** Methods that settle through a bank/gateway and therefore want a reference. */
const NEEDS_REFERENCE = new Set([
  'cheque', 'bank_transfer', 'card', 'qr', 'esewa', 'khalti',
  'connectips', 'fonepay', 'stripe', 'paypal',
])

export default function NewOfferingPage() {
  const router = useRouter()
  const qc = useQueryClient()

  const today = new Date().toISOString().slice(0, 10)
  const [form, setForm] = useState({
    serviceDate: today,
    serviceTime: '10:30',
    serviceName: SERVICES[0],
    categoryId: '',
    fundId: '',
    donorName: '',
    isAnonymous: false,
    giverType: 'member',
    amount: '',
    currency: 'NPR',
    paymentMethod: 'cash',
    referenceNo: '',
    bankAccountId: '',
    notes: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => {
    setForm((f) => ({ ...f, [k]: v }))
    setErrors((e) => (e[k as string] ? { ...e, [k as string]: '' } : e))
  }

  const { data: categories } = useQuery({
    queryKey: ['offering-categories'],
    queryFn: offeringsApi.categories,
    staleTime: 5 * 60_000,
  })
  const { data: funds } = useQuery({ queryKey: ['funds'], queryFn: offeringsApi.funds, staleTime: 5 * 60_000 })
  const { data: banks } = useQuery({
    queryKey: ['bank-accounts'],
    queryFn: offeringsApi.bankAccounts,
    staleTime: 5 * 60_000,
  })

  const minor = toMinor(form.amount)

  function validate(): boolean {
    const e: Record<string, string> = {}
    if (!form.serviceDate) e.serviceDate = 'Pick the service date'
    else if (form.serviceDate > today) e.serviceDate = 'The date cannot be in the future'
    if (!form.amount.trim()) e.amount = 'Enter the amount'
    else if (minor === null) e.amount = 'Use digits only, up to two decimals'
    else if (minor <= 0) e.amount = 'Amount must be greater than zero'
    if (!form.categoryId) e.categoryId = 'Choose what this offering is for'
    if (!form.isAnonymous && !form.donorName.trim() && form.giverType === 'member')
      e.donorName = 'Name the giver, or mark the gift anonymous'
    if (NEEDS_REFERENCE.has(form.paymentMethod) && !form.referenceNo.trim())
      e.referenceNo = 'A reference is needed to reconcile this payment'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const save = useMutation({
    mutationFn: (submit: boolean) =>
      offeringsApi.create({
        service_date: form.serviceDate,
        service_time: form.serviceTime || undefined,
        service_name: form.serviceName,
        category_id: form.categoryId || undefined,
        fund_id: form.fundId || undefined,
        donor_name: form.isAnonymous ? '' : form.donorName.trim(),
        is_anonymous: form.isAnonymous,
        giver_type: form.giverType,
        total_amount: minor,
        currency: form.currency,
        payment_method: form.paymentMethod,
        reference_no: form.referenceNo.trim(),
        bank_account_id: form.bankAccountId || undefined,
        notes: form.notes.trim(),
        submit,
      }),
    onSuccess: (res: { receipt_no?: string; status: string }) => {
      qc.invalidateQueries({ queryKey: ['offerings-table'] })
      qc.invalidateQueries({ queryKey: ['offering-dashboard'] })
      toast.success(
        res.status === 'draft'
          ? 'Saved as draft'
          : `Submitted${res.receipt_no ? ` — receipt ${res.receipt_no}` : ''}`
      )
      router.push('/admin/offering-management/offerings')
    },
    onError: (e: Error) => toast.error(e.message || 'Could not save this offering'),
  })

  const submit = (asDraft: boolean) => {
    // A draft is a scratchpad, so it only needs a date and an amount; full
    // validation applies when the record is submitted for approval.
    if (!asDraft && !validate()) {
      toast.error('Check the highlighted fields')
      return
    }
    if (asDraft && (!form.serviceDate || minor === null || minor <= 0)) {
      setErrors({ amount: minor === null || minor <= 0 ? 'Enter a valid amount to save a draft' : '' })
      return
    }
    save.mutate(!asDraft)
  }

  const err = (k: string) =>
    errors[k] ? (
      <p id={`${k}-error`} role="alert" className="mt-1 text-xs text-destructive">
        {errors[k]}
      </p>
    ) : null

  const aria = (k: string) => ({
    'aria-invalid': errors[k] ? true : undefined,
    'aria-describedby': errors[k] ? `${k}-error` : undefined,
  })

  return (
    <>
      <PageHeader
        title="Record Offering"
        subtitle="Save as a draft to finish later, or submit for approval to issue a receipt"
      />

      <form
        onSubmit={(e) => {
          e.preventDefault()
          submit(false)
        }}
        className="grid gap-4 lg:grid-cols-3"
      >
        <div className="lg:col-span-2 space-y-4">
          {/* When & where */}
          <section className={`${CARD} p-4 sm:p-5`}>
            <h2 className="font-semibold mb-4">Service</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <Label htmlFor="date" required>Date</Label>
                <input id="date" type="date" max={today} className={field} value={form.serviceDate} onChange={(e) => set('serviceDate', e.target.value)} {...aria('serviceDate')} />
                {err('serviceDate')}
              </div>
              <div>
                <Label htmlFor="time">Time</Label>
                <input id="time" type="time" className={field} value={form.serviceTime} onChange={(e) => set('serviceTime', e.target.value)} />
              </div>
              <div>
                <Label htmlFor="service">Service</Label>
                <select id="service" className={field} value={form.serviceName} onChange={(e) => set('serviceName', e.target.value)}>
                  {SERVICES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
          </section>

          {/* Designation */}
          <section className={`${CARD} p-4 sm:p-5`}>
            <h2 className="font-semibold mb-4">Designation</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="category" required hint="What the gift is for">Category</Label>
                <select id="category" className={field} value={form.categoryId} onChange={(e) => set('categoryId', e.target.value)} {...aria('categoryId')}>
                  <option value="">Select a category…</option>
                  {(categories ?? []).filter((c) => c.isActive).map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                {err('categoryId')}
              </div>
              <div>
                <Label htmlFor="fund" hint="Leave blank to use the category default">Fund</Label>
                <select id="fund" className={field} value={form.fundId} onChange={(e) => set('fundId', e.target.value)}>
                  <option value="">Category default</option>
                  {(funds ?? []).map((f) => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <p className="mt-3 flex items-start gap-2 text-xs text-muted-foreground">
              <Info className="size-3.5 mt-0.5 shrink-0" aria-hidden />
              If the category has allocation rules, the amount is split across funds automatically on save.
            </p>
          </section>

          {/* Giver */}
          <section className={`${CARD} p-4 sm:p-5`}>
            <div className="flex items-center justify-between gap-3 mb-4">
              <h2 className="font-semibold">Giver</h2>
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isAnonymous}
                  onChange={(e) => set('isAnonymous', e.target.checked)}
                  className="size-4 rounded border-border accent-[var(--church-blue)]"
                />
                <span className="inline-flex items-center gap-1.5 text-sm">
                  <EyeOff className="size-3.5" aria-hidden />
                  Anonymous
                </span>
              </label>
            </div>
            {form.isAnonymous ? (
              <p className="text-sm text-muted-foreground rounded-xl bg-muted p-3">
                No giver details will be stored for this offering. It still counts toward totals and reports.
              </p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="donor">Name</Label>
                  <input id="donor" className={field} placeholder="Full name" value={form.donorName} onChange={(e) => set('donorName', e.target.value)} {...aria('donorName')} />
                  {err('donorName')}
                </div>
                <div>
                  <Label htmlFor="giver-type">Giver type</Label>
                  <select id="giver-type" className={field} value={form.giverType} onChange={(e) => set('giverType', e.target.value)}>
                    {GIVER_TYPES.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
                  </select>
                </div>
              </div>
            )}
          </section>

          {/* Payment */}
          <section className={`${CARD} p-4 sm:p-5`}>
            <h2 className="font-semibold mb-4">Payment</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="amount" required>Amount</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">Rs</span>
                  <input
                    id="amount"
                    inputMode="decimal"
                    placeholder="0.00"
                    className={`${field} pl-9 text-right tabular-nums font-medium`}
                    value={form.amount}
                    onChange={(e) => set('amount', e.target.value)}
                    {...aria('amount')}
                  />
                </div>
                {err('amount')}
                {minor !== null && minor > 0 && (
                  <p className="mt-1 text-xs text-muted-foreground">{money(minor)}</p>
                )}
              </div>
              <div>
                <Label htmlFor="method">Payment method</Label>
                <select id="method" className={field} value={form.paymentMethod} onChange={(e) => set('paymentMethod', e.target.value)}>
                  {PAYMENT_METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
              </div>
              {NEEDS_REFERENCE.has(form.paymentMethod) && (
                <>
                  <div>
                    <Label htmlFor="reference" required hint="Transaction or cheque number">Reference</Label>
                    <input id="reference" className={field} value={form.referenceNo} onChange={(e) => set('referenceNo', e.target.value)} {...aria('referenceNo')} />
                    {err('referenceNo')}
                  </div>
                  <div>
                    <Label htmlFor="bank">Bank account</Label>
                    <select id="bank" className={field} value={form.bankAccountId} onChange={(e) => set('bankAccountId', e.target.value)}>
                      <option value="">Not specified</option>
                      {(banks ?? []).filter((b) => b.isActive).map((b) => (
                        <option key={b.id} value={b.id}>{b.bankName} — {b.accountNumber.slice(-4).padStart(8, '•')}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}
            </div>
            <div className="mt-4">
              <Label htmlFor="notes">Notes</Label>
              <textarea id="notes" rows={3} className={`${field} py-2 resize-y`} placeholder="Anything the finance team should know" value={form.notes} onChange={(e) => set('notes', e.target.value)} />
            </div>
          </section>
        </div>

        {/* Summary rail */}
        <aside className="space-y-4">
          <div className={`${CARD} p-4 sm:p-5 lg:sticky lg:top-4`}>
            <h2 className="font-semibold mb-3">Summary</h2>
            <dl className="space-y-2 text-sm">
              {[
                ['Date', form.serviceDate || '—'],
                ['Service', form.serviceName],
                ['Category', categories?.find((c) => c.id === form.categoryId)?.name ?? 'Not selected'],
                ['Giver', form.isAnonymous ? 'Anonymous' : form.donorName || '—'],
                ['Method', PAYMENT_METHODS.find((m) => m.value === form.paymentMethod)?.label ?? '—'],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3">
                  <dt className="text-muted-foreground shrink-0">{k}</dt>
                  <dd className="text-right truncate" title={String(v)}>{v}</dd>
                </div>
              ))}
              <div className="flex justify-between gap-3 pt-2 border-t border-border">
                <dt className="font-medium">Amount</dt>
                <dd className="font-semibold tabular-nums">
                  {minor !== null && minor > 0 ? money(minor) : '—'}
                </dd>
              </div>
            </dl>

            <div className="mt-4 space-y-2">
              <button type="submit" disabled={save.isPending} className={`${btn.primary} w-full`}>
                <Send className="size-4" aria-hidden />
                {save.isPending ? 'Saving…' : 'Submit for approval'}
              </button>
              <button type="button" onClick={() => submit(true)} disabled={save.isPending} className={`${btn.secondary} w-full`}>
                <Save className="size-4" aria-hidden />
                Save draft
              </button>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              A receipt number is issued on submission. Drafts do not get one, so numbering stays gap-free.
            </p>
          </div>
        </aside>
      </form>
    </>
  )
}
