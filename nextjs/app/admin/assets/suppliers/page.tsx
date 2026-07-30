'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Truck, Plus, X, Save, Mail, Phone } from 'lucide-react'
import { assetsApi } from '@/lib/assets/api'
import {
  CARD, PageHeader, EmptyState, TableSkeleton, Chip, btn, field, Label,
} from '@/components/offerings/ui'

export default function SuppliersPage() {
  const qc = useQueryClient()
  const [creating, setCreating] = useState(false)
  const [f, setF] = useState({ name: '', contactPerson: '', phone: '', email: '', address: '', website: '' })

  const { data, isLoading } = useQuery({ queryKey: ['suppliers'], queryFn: assetsApi.suppliers })

  const create = useMutation({
    mutationFn: () =>
      assetsApi.createSupplier({
        name: f.name.trim(),
        contact_person: f.contactPerson.trim(),
        phone: f.phone.trim(),
        email: f.email.trim(),
        address: f.address.trim(),
        website: f.website.trim(),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['suppliers'] })
      toast.success('Supplier added')
      setCreating(false)
      setF({ name: '', contactPerson: '', phone: '', email: '', address: '', website: '' })
    },
    // Names are unique case-insensitively, so this catches "ABC Ltd" vs "abc ltd".
    onError: (e: Error) => toast.error(e.message || 'Could not add this supplier'),
  })

  return (
    <>
      <PageHeader
        title="Suppliers"
        subtitle="Who the church buys from and who services the equipment"
        actions={
          <button type="button" onClick={() => setCreating((v) => !v)} className={btn.primary}>
            <Plus className="size-4" aria-hidden /> Add Supplier
          </button>
        }
      />

      {creating && (
        <section className={`${CARD} p-4 sm:p-5 mb-4`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">New supplier</h2>
            <button type="button" onClick={() => setCreating(false)} className={btn.ghost} aria-label="Close">
              <X className="size-4" aria-hidden />
            </button>
          </div>
          <form onSubmit={(e) => { e.preventDefault(); if (f.name.trim()) create.mutate() }} className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label htmlFor="s-name" required>Name</Label>
              <input id="s-name" className={field} value={f.name} onChange={(e) => setF((s) => ({ ...s, name: e.target.value }))} />
            </div>
            <div>
              <Label htmlFor="s-contact">Contact person</Label>
              <input id="s-contact" className={field} value={f.contactPerson} onChange={(e) => setF((s) => ({ ...s, contactPerson: e.target.value }))} />
            </div>
            <div>
              <Label htmlFor="s-phone">Phone</Label>
              <input id="s-phone" className={field} value={f.phone} onChange={(e) => setF((s) => ({ ...s, phone: e.target.value }))} />
            </div>
            <div>
              <Label htmlFor="s-email">Email</Label>
              <input id="s-email" type="email" className={field} value={f.email} onChange={(e) => setF((s) => ({ ...s, email: e.target.value }))} />
            </div>
            <div>
              <Label htmlFor="s-web">Website</Label>
              <input id="s-web" className={field} value={f.website} onChange={(e) => setF((s) => ({ ...s, website: e.target.value }))} />
            </div>
            <div>
              <Label htmlFor="s-addr">Address</Label>
              <input id="s-addr" className={field} value={f.address} onChange={(e) => setF((s) => ({ ...s, address: e.target.value }))} />
            </div>
            <div className="sm:col-span-3 flex justify-end gap-2">
              <button type="button" onClick={() => setCreating(false)} className={btn.secondary}>Cancel</button>
              <button type="submit" disabled={!f.name.trim() || create.isPending} className={btn.primary}>
                <Save className="size-4" aria-hidden />
                {create.isPending ? 'Saving…' : 'Add supplier'}
              </button>
            </div>
          </form>
        </section>
      )}

      <div className={`${CARD} overflow-hidden`}>
        {isLoading ? (
          <TableSkeleton cols={5} />
        ) : !data?.length ? (
          <EmptyState
            icon={Truck}
            title="No suppliers"
            subtitle="Add the vendors you buy equipment from."
            action={<button type="button" onClick={() => setCreating(true)} className={btn.primary}>Add Supplier</button>}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10 bg-card/95 backdrop-blur border-b border-border">
                <tr>
                  {['Supplier', 'Contact', 'Phone', 'Email', 'Assets', 'Status'].map((h) => (
                    <th key={h} scope="col" className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((s) => (
                  <tr key={s.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium">{s.name}</p>
                      {s.address && <p className="text-xs text-muted-foreground truncate max-w-[16rem]">{s.address}</p>}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{s.contactPerson || '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                      {s.phone ? (
                        <a href={`tel:${s.phone}`} className="inline-flex items-center gap-1 hover:text-primary">
                          <Phone className="size-3" aria-hidden />{s.phone}
                        </a>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {s.email ? (
                        <a href={`mailto:${s.email}`} className="inline-flex items-center gap-1 hover:text-primary truncate max-w-[14rem]">
                          <Mail className="size-3 shrink-0" aria-hidden />{s.email}
                        </a>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-muted-foreground">{s.assetCount}</td>
                    <td className="px-4 py-3">
                      {s.isActive
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
