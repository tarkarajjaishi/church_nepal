'use client'

import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Save, Info } from 'lucide-react'
import { libraryApi } from '@/lib/library/api'
import { money, toMinor } from '@/lib/offerings/api'
import { CARD, PageHeader, ErrorState, btn, field, Label } from '@/components/offerings/ui'

const BLANK = {
  loanDays: '', maxRenewals: '', renewalDays: '',
  dailyFee: '', maxFee: '', maxLoansPerPerson: '', holdDays: '',
}

export default function LibrarySettingsPage() {
  const qc = useQueryClient()
  const [f, setF] = useState(BLANK)

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['library', 'settings'],
    queryFn: libraryApi.settings,
  })

  useEffect(() => {
    if (!data) return
    setF({
      loanDays: String(data.loanDays),
      maxRenewals: String(data.maxRenewals),
      renewalDays: String(data.renewalDays),
      dailyFee: String(data.dailyFee / 100),
      maxFee: String(data.maxFee / 100),
      maxLoansPerPerson: String(data.maxLoansPerPerson),
      holdDays: String(data.holdDays),
    })
  }, [data])

  const save = useMutation({
    mutationFn: () =>
      libraryApi.updateSettings({
        loan_days: Number(f.loanDays),
        max_renewals: Number(f.maxRenewals),
        renewal_days: Number(f.renewalDays),
        daily_fee: toMinor(f.dailyFee) ?? 0,
        max_fee: toMinor(f.maxFee) ?? 0,
        max_loans_per_person: Number(f.maxLoansPerPerson),
        hold_days: Number(f.holdDays),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['library'] })
      toast.success('Lending rules saved')
    },
    onError: (e: Error) => toast.error(e.message || 'Could not save these rules'),
  })

  if (error) {
    return (
      <>
        <PageHeader title="Lending rules" />
        <div className={CARD}><ErrorState message={(error as Error).message} onRetry={() => refetch()} /></div>
      </>
    )
  }

  const dailyFee = toMinor(f.dailyFee) ?? 0
  const maxFee = toMinor(f.maxFee) ?? 0

  return (
    <>
      <PageHeader title="Lending rules" subtitle="How long books go out for, and what happens when they are late" />

      <form onSubmit={(e) => { e.preventDefault(); save.mutate() }} className="max-w-2xl space-y-4">
        <section className={`${CARD} p-4 sm:p-5`}>
          <h2 className="font-semibold mb-4">Loan period</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label htmlFor="s-days">Days per loan</Label>
              <input id="s-days" type="number" min={1} className={field} value={f.loanDays} disabled={isLoading} onChange={(e) => setF((s) => ({ ...s, loanDays: e.target.value }))} />
            </div>
            <div>
              <Label htmlFor="s-renewals" hint="Refused while someone is queued">Renewals allowed</Label>
              <input id="s-renewals" type="number" min={0} className={field} value={f.maxRenewals} disabled={isLoading} onChange={(e) => setF((s) => ({ ...s, maxRenewals: e.target.value }))} />
            </div>
            <div>
              <Label htmlFor="s-rendays">Days per renewal</Label>
              <input id="s-rendays" type="number" min={1} className={field} value={f.renewalDays} disabled={isLoading} onChange={(e) => setF((s) => ({ ...s, renewalDays: e.target.value }))} />
            </div>
          </div>
        </section>

        <section className={`${CARD} p-4 sm:p-5`}>
          <h2 className="font-semibold mb-4">Overdue fees</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="s-fee" hint="Zero means no fees at all">Per day late (Rs)</Label>
              <input id="s-fee" inputMode="decimal" className={field} value={f.dailyFee} disabled={isLoading} onChange={(e) => setF((s) => ({ ...s, dailyFee: e.target.value }))} />
            </div>
            <div>
              <Label htmlFor="s-max" hint="Zero means no ceiling">Most that can be charged (Rs)</Label>
              <input id="s-max" inputMode="decimal" className={field} value={f.maxFee} disabled={isLoading} onChange={(e) => setF((s) => ({ ...s, maxFee: e.target.value }))} />
            </div>
          </div>
          <div className="mt-4 flex items-start gap-2.5 rounded-xl bg-muted p-3 text-sm text-muted-foreground">
            <Info className="size-4 shrink-0 mt-0.5" aria-hidden />
            <p>
              {dailyFee === 0
                ? 'No fee is charged, however late a book is. Overdue days are still counted so you know what to chase.'
                : maxFee === 0
                ? `A book two weeks late costs ${money(dailyFee * 14)}, and keeps climbing with no ceiling.`
                : `A book two weeks late costs ${money(Math.min(dailyFee * 14, maxFee))}, and never goes past ${money(maxFee)}.`}
              {' '}Changing these rules never alters a fee already charged.
            </p>
          </div>
        </section>

        <section className={`${CARD} p-4 sm:p-5`}>
          <h2 className="font-semibold mb-4">Limits</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="s-limit">Books one person may hold</Label>
              <input id="s-limit" type="number" min={1} className={field} value={f.maxLoansPerPerson} disabled={isLoading} onChange={(e) => setF((s) => ({ ...s, maxLoansPerPerson: e.target.value }))} />
            </div>
            <div>
              <Label htmlFor="s-hold" hint="Before the next person is offered it">Days to collect a reserved book</Label>
              <input id="s-hold" type="number" min={1} className={field} value={f.holdDays} disabled={isLoading} onChange={(e) => setF((s) => ({ ...s, holdDays: e.target.value }))} />
            </div>
          </div>
        </section>

        <div className="flex justify-end">
          <button type="submit" disabled={isLoading || save.isPending} className={btn.primary}>
            <Save className="size-4" aria-hidden />
            {save.isPending ? 'Saving…' : 'Save rules'}
          </button>
        </div>
      </form>
    </>
  )
}
