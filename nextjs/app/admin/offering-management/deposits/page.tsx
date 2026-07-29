'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Landmark, Plus, ShieldCheck, X, ExternalLink } from 'lucide-react'
import { offeringsApi, money, toMinor, type Deposit } from '@/lib/offerings/api'
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

const STATUS_STYLE: Record<Deposit['status'], string> = {
  pending: 'bg-amber-100 text-amber-800 border-amber-200',
  deposited: 'bg-blue-100 text-blue-800 border-blue-200',
  verified: 'bg-green-100 text-green-800 border-green-200',
  rejected: 'bg-red-100 text-red-800 border-red-200',
  cancelled: 'bg-gray-100 text-gray-700 border-gray-200',
}

export default function DepositsPage() {
  const qc = useQueryClient()
  const today = new Date().toISOString().slice(0, 10)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    depositDate: today,
    bankAccountId: '',
    referenceNo: '',
    amount: '',
    slipUrl: '',
    depositedBy: '',
    notes: '',
  })

  const { data: deposits, isLoading } = useQuery({
    queryKey: ['deposits'],
    queryFn: offeringsApi.deposits,
  })
  const { data: banks } = useQuery({
    queryKey: ['bank-accounts'],
    queryFn: offeringsApi.bankAccounts,
    staleTime: 5 * 60_000,
  })

  const bankName = (id: string | null) => {
    const b = banks?.find((x) => x.id === id)
    return b ? `${b.bankName} ····${b.accountNumber.slice(-4)}` : '—'
  }

  const create = useMutation({
    mutationFn: () =>
      offeringsApi.createDeposit({
        deposit_date: form.depositDate,
        bank_account_id: form.bankAccountId || undefined,
        reference_no: form.referenceNo.trim(),
        amount: toMinor(form.amount) ?? 0,
        slip_url: form.slipUrl.trim(),
        deposited_by: form.depositedBy.trim(),
        notes: form.notes.trim(),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['deposits'] })
      qc.invalidateQueries({ queryKey: ['offering-dashboard'] })
      toast.success('Deposit recorded')
      setShowForm(false)
      setForm({ depositDate: today, bankAccountId: '', referenceNo: '', amount: '', slipUrl: '', depositedBy: '', notes: '' })
    },
    onError: (e: Error) => toast.error(e.message || 'Could not record this deposit'),
  })

  const verify = useMutation({
    mutationFn: (id: string) => offeringsApi.verifyDeposit(id),
    onSuccess: (d: Deposit) => {
      qc.invalidateQueries({ queryKey: ['deposits'] })
      qc.invalidateQueries({ queryKey: ['bank-accounts'] })
      qc.invalidateQueries({ queryKey: ['offering-dashboard'] })
      toast.success(`Verified — ${money(d.amount)} credited to the account`)
    },
    onError: (e: Error) => toast.error(e.message || 'Could not verify this deposit'),
  })

  const setStatus = useMutation({
    mutationFn: ({ id, status, reason }: { id: string; status: string; reason?: string }) =>
      offeringsApi.setDepositStatus(id, status, reason),
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ['deposits'] })
      toast.success(`Deposit marked ${v.status}`)
    },
    onError: (e: Error) => toast.error(e.message || 'Could not update this deposit'),
  })

  const reject = (id: string) => {
    const reason = window.prompt('Why is this deposit being rejected?')
    if (reason === null) return
    if (!reason.trim()) return toast.error('A reason is required')
    setStatus.mutate({ id, status: 'rejected', reason })
  }

  const canCreate = (toMinor(form.amount) ?? 0) > 0

  return (
    <>
      <PageHeader
        title="Deposit Management"
        subtitle="Bank balances move only when a deposit is verified"
        actions={
          <button type="button" onClick={() => setShowForm((v) => !v)} className={btn.primary}>
            <Plus className="size-4" aria-hidden />
            Record Deposit
          </button>
        }
      />

      {showForm && (
        <section className={`${CARD} p-4 sm:p-5 mb-4`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">New deposit</h2>
            <button type="button" onClick={() => setShowForm(false)} className={btn.ghost} aria-label="Close form">
              <X className="size-4" aria-hidden />
            </button>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (canCreate) create.mutate()
            }}
            className="grid gap-4 sm:grid-cols-3"
          >
            <div>
              <Label htmlFor="d-date">Deposit date</Label>
              <input id="d-date" type="date" max={today} className={field} value={form.depositDate} onChange={(e) => setForm((f) => ({ ...f, depositDate: e.target.value }))} />
            </div>
            <div>
              <Label htmlFor="d-bank">Bank account</Label>
              <select id="d-bank" className={field} value={form.bankAccountId} onChange={(e) => setForm((f) => ({ ...f, bankAccountId: e.target.value }))}>
                <option value="">Select an account…</option>
                {(banks ?? []).filter((b) => b.isActive).map((b) => (
                  <option key={b.id} value={b.id}>{b.bankName} — {b.accountName}</option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="d-amount" required>Amount</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">Rs</span>
                <input id="d-amount" inputMode="decimal" className={`${field} pl-9 text-right tabular-nums`} placeholder="0.00" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label htmlFor="d-ref">Reference</Label>
              <input id="d-ref" className={field} placeholder="Slip / txn number" value={form.referenceNo} onChange={(e) => setForm((f) => ({ ...f, referenceNo: e.target.value }))} />
            </div>
            <div>
              <Label htmlFor="d-by">Deposited by</Label>
              <input id="d-by" className={field} placeholder="Name" value={form.depositedBy} onChange={(e) => setForm((f) => ({ ...f, depositedBy: e.target.value }))} />
            </div>
            <div>
              <Label htmlFor="d-slip" hint="Link to the scanned slip">Slip URL</Label>
              <input id="d-slip" type="url" className={field} placeholder="https://…" value={form.slipUrl} onChange={(e) => setForm((f) => ({ ...f, slipUrl: e.target.value }))} />
            </div>
            <div className="sm:col-span-3">
              <Label htmlFor="d-notes">Notes</Label>
              <textarea id="d-notes" rows={2} className={`${field} py-2 resize-y`} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
            </div>
            <div className="sm:col-span-3 flex justify-end gap-2">
              <button type="button" onClick={() => setShowForm(false)} className={btn.secondary}>Cancel</button>
              <button type="submit" disabled={!canCreate || create.isPending} className={btn.primary}>
                {create.isPending ? 'Saving…' : 'Record deposit'}
              </button>
            </div>
          </form>
        </section>
      )}

      <div className={`${CARD} overflow-hidden`}>
        {isLoading ? (
          <TableSkeleton cols={7} />
        ) : !deposits?.length ? (
          <EmptyState
            icon={Landmark}
            title="No deposits recorded"
            subtitle="Record a deposit once cash has gone to the bank."
            action={
              <button type="button" onClick={() => setShowForm(true)} className={btn.primary}>
                Record Deposit
              </button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10 bg-card/95 backdrop-blur border-b border-border">
                <tr>
                  {['Date', 'Bank account', 'Reference', 'Amount', 'Deposited by', 'Verified by', 'Status', 'Slip', ''].map((h) => (
                    <th key={h} scope="col" className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {deposits.map((d) => (
                  <tr key={d.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap">{d.depositDate}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{bankName(d.bankAccountId)}</td>
                    <td className="px-4 py-3 font-mono text-xs">{d.referenceNo || '—'}</td>
                    <td className="px-4 py-3 text-right tabular-nums font-medium whitespace-nowrap">{money(d.amount)}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground max-w-[10rem] truncate">{d.depositedBy || '—'}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground max-w-[10rem] truncate">{d.verifiedBy || '—'}</td>
                    <td className="px-4 py-3">
                      <Chip className={STATUS_STYLE[d.status]}>
                        {d.status.charAt(0).toUpperCase() + d.status.slice(1)}
                      </Chip>
                    </td>
                    <td className="px-4 py-3">
                      {d.slipUrl ? (
                        <a
                          href={d.slipUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                        >
                          View <ExternalLink className="size-3" aria-hidden />
                        </a>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      {d.status !== 'verified' && d.status !== 'rejected' && d.status !== 'cancelled' && (
                        <span className="inline-flex gap-1">
                          <button type="button" onClick={() => verify.mutate(d.id)} disabled={verify.isPending} className={btn.secondary}>
                            <ShieldCheck className="size-3.5" aria-hidden />
                            Verify
                          </button>
                          <button type="button" onClick={() => reject(d.id)} disabled={setStatus.isPending} className={btn.ghost}>
                            Reject
                          </button>
                        </span>
                      )}
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
