'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Building2, Plus, X, Save } from 'lucide-react'
import { offeringsApi, money, toMinor } from '@/lib/offerings/api'
import { CARD, PageHeader, EmptyState, TableSkeleton, Chip, btn, field, Label } from '@/components/offerings/ui'

export default function BankAccountsPage() {
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [f, setF] = useState({
    bankName: '', accountName: '', accountNumber: '', branch: '', swiftCode: '', openingBalance: '',
  })

  const { data, isLoading } = useQuery({ queryKey: ['bank-accounts'], queryFn: offeringsApi.bankAccounts })

  const create = useMutation({
    mutationFn: () =>
      offeringsApi.createBankAccount({
        bank_name: f.bankName.trim(),
        account_name: f.accountName.trim(),
        account_number: f.accountNumber.trim(),
        branch: f.branch.trim(),
        swift_code: f.swiftCode.trim(),
        opening_balance: toMinor(f.openingBalance) ?? 0,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bank-accounts'] })
      toast.success('Bank account added')
      setOpen(false)
      setF({ bankName: '', accountName: '', accountNumber: '', branch: '', swiftCode: '', openingBalance: '' })
    },
    onError: (e: Error) => toast.error(e.message || 'Could not add this account'),
  })

  const valid = f.bankName.trim() && f.accountNumber.trim()
  const totalHeld = (data ?? []).filter((a) => a.isActive).reduce((s, a) => s + a.currentBalance, 0)

  return (
    <>
      <PageHeader
        title="Bank Accounts"
        subtitle={data?.length ? `${money(totalHeld)} across ${data.filter((a) => a.isActive).length} active account(s)` : undefined}
        actions={
          <button type="button" onClick={() => setOpen((v) => !v)} className={btn.primary}>
            <Plus className="size-4" aria-hidden />
            Add Account
          </button>
        }
      />

      {open && (
        <section className={`${CARD} p-4 sm:p-5 mb-4`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">New bank account</h2>
            <button type="button" onClick={() => setOpen(false)} className={btn.ghost} aria-label="Close"><X className="size-4" aria-hidden /></button>
          </div>
          <form onSubmit={(e) => { e.preventDefault(); if (valid) create.mutate() }} className="grid gap-4 sm:grid-cols-3">
            <div><Label htmlFor="b-bank" required>Bank name</Label><input id="b-bank" className={field} value={f.bankName} onChange={(e) => setF((s) => ({ ...s, bankName: e.target.value }))} /></div>
            <div><Label htmlFor="b-name">Account name</Label><input id="b-name" className={field} value={f.accountName} onChange={(e) => setF((s) => ({ ...s, accountName: e.target.value }))} /></div>
            <div><Label htmlFor="b-num" required>Account number</Label><input id="b-num" className={field} value={f.accountNumber} onChange={(e) => setF((s) => ({ ...s, accountNumber: e.target.value }))} /></div>
            <div><Label htmlFor="b-branch">Branch</Label><input id="b-branch" className={field} value={f.branch} onChange={(e) => setF((s) => ({ ...s, branch: e.target.value }))} /></div>
            <div><Label htmlFor="b-swift">SWIFT</Label><input id="b-swift" className={field} value={f.swiftCode} onChange={(e) => setF((s) => ({ ...s, swiftCode: e.target.value }))} /></div>
            <div>
              <Label htmlFor="b-open">Opening balance</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">Rs</span>
                <input id="b-open" inputMode="decimal" className={`${field} pl-9 text-right tabular-nums`} placeholder="0.00" value={f.openingBalance} onChange={(e) => setF((s) => ({ ...s, openingBalance: e.target.value }))} />
              </div>
            </div>
            <div className="sm:col-span-3 flex justify-end gap-2">
              <button type="button" onClick={() => setOpen(false)} className={btn.secondary}>Cancel</button>
              <button type="submit" disabled={!valid || create.isPending} className={btn.primary}><Save className="size-4" aria-hidden />{create.isPending ? 'Saving…' : 'Save account'}</button>
            </div>
          </form>
        </section>
      )}

      <div className={`${CARD} overflow-hidden`}>
        {isLoading ? <TableSkeleton cols={6} /> : !data?.length ? (
          <EmptyState icon={Building2} title="No bank accounts" subtitle="Add an account so deposits can be credited to it."
            action={<button type="button" onClick={() => setOpen(true)} className={btn.primary}>Add Account</button>} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10 bg-card/95 backdrop-blur border-b border-border">
                <tr>{['Bank', 'Account name', 'Number', 'Branch', 'Opening', 'Current', 'Status'].map((h) => (
                  <th key={h} scope="col" className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">{h}</th>))}
                </tr>
              </thead>
              <tbody>
                {data.map((a) => (
                  <tr key={a.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3 font-medium whitespace-nowrap">{a.bankName}</td>
                    <td className="px-4 py-3 max-w-[14rem] truncate" title={a.accountName}>{a.accountName || '—'}</td>
                    <td className="px-4 py-3 font-mono text-xs">····{a.accountNumber.slice(-4)}</td>
                    <td className="px-4 py-3 text-muted-foreground">{a.branch || '—'}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-muted-foreground whitespace-nowrap">{money(a.openingBalance)}</td>
                    <td className="px-4 py-3 text-right tabular-nums font-medium whitespace-nowrap">{money(a.currentBalance)}</td>
                    <td className="px-4 py-3">{a.isActive
                      ? <Chip className="bg-green-100 text-green-800 border-green-200">Active</Chip>
                      : <Chip className="bg-gray-100 text-gray-700 border-gray-200">Inactive</Chip>}</td>
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
