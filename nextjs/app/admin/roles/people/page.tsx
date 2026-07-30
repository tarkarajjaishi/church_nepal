'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Users, X, Check, ShieldAlert, ChevronLeft, Info, Search } from 'lucide-react'
import { rolesApi, SYSTEM_ADMIN, type UserWithRoles } from '@/lib/roles/api'
import {
  CARD, PageHeader, EmptyState, ErrorState, TableSkeleton, Chip, btn, field,
} from '@/components/offerings/ui'

export default function RoleAssignmentsPage() {
  const qc = useQueryClient()
  const [editing, setEditing] = useState<UserWithRoles | null>(null)
  const [picked, setPicked] = useState<Set<string>>(new Set())
  const [search, setSearch] = useState('')

  const { data: users, isLoading, error, refetch } = useQuery({
    queryKey: ['role-assignments'],
    queryFn: rolesApi.users,
  })
  const { data: roles } = useQuery({ queryKey: ['roles'], queryFn: rolesApi.roles })

  const open = (u: UserWithRoles) => {
    setEditing(u)
    const ids = (roles ?? []).filter((r) => u.roleSlugs.includes(r.slug)).map((r) => r.id)
    setPicked(new Set(ids))
  }

  const save = useMutation({
    mutationFn: () => rolesApi.setUserRoles(editing!.id, [...picked]),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['role-assignments'] })
      qc.invalidateQueries({ queryKey: ['roles'] })
      qc.invalidateQueries({ queryKey: ['my-access'] })
      toast.success(`${editing!.name || editing!.email} updated and signed out`)
      setEditing(null)
    },
    // The refusal worth reading: taking the last administrator's role away.
    onError: (e: Error) => toast.error(e.message || 'Could not change these roles'),
  })

  const q = search.trim().toLowerCase()
  const shown = (users ?? []).filter(
    (u) => !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
  )
  const unassigned = (users ?? []).filter((u) => u.roleSlugs.length === 0)

  return (
    <>
      <Link href="/admin/roles" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-3">
        <ChevronLeft className="size-3.5" aria-hidden /> Back to roles
      </Link>

      <PageHeader title="Who holds what" subtitle="Give each person on the team the roles their job needs" />

      {unassigned.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 mb-4 flex items-start gap-3">
          <ShieldAlert className="size-5 shrink-0 text-amber-700 mt-0.5" aria-hidden />
          <div className="text-sm text-amber-900">
            <p className="font-medium">
              {unassigned.length} account{unassigned.length === 1 ? '' : 's'} hold no role
            </p>
            <p className="mt-0.5">
              They can sign in but cannot reach anything. Give them a role, or remove the account.
            </p>
          </div>
        </div>
      )}

      <div className={`${CARD} p-3 sm:p-4 mb-4`}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" aria-hidden />
          <input
            className={`${field} pl-9`}
            placeholder="Find a person"
            aria-label="Find a person"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className={`${CARD} overflow-hidden`}>
        {error ? (
          <ErrorState message={(error as Error).message} onRetry={() => refetch()} />
        ) : isLoading ? (
          <TableSkeleton cols={4} />
        ) : !shown.length ? (
          <EmptyState icon={Users} title={q ? 'Nobody matches that' : 'No accounts'} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10 bg-card/95 backdrop-blur border-b border-border">
                <tr>
                  {['Person', 'Roles', 'Can reach', ''].map((h, i) => (
                    <th key={i} scope="col" className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {shown.map((u) => (
                  <tr key={u.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium">{u.name || '—'}</p>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      {u.roleNames.length ? (
                        <div className="flex flex-wrap gap-1">
                          {u.roleNames.map((n) => (
                            <Chip key={n} className="bg-muted text-foreground border-border">{n}</Chip>
                          ))}
                        </div>
                      ) : (
                        <Chip className="bg-amber-100 text-amber-800 border-amber-200">No role</Chip>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {u.permissions.includes(SYSTEM_ADMIN)
                        ? <span className="text-amber-700">Everything</span>
                        : u.permissions.length === 0
                        ? 'Nothing'
                        : `${u.permissions.length} permission${u.permissions.length === 1 ? '' : 's'}`}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button type="button" onClick={() => open(u)} className={btn.secondary}>Change</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button type="button" className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={() => setEditing(null)} aria-label="Cancel" />
          <div role="dialog" aria-modal="true" aria-labelledby="assign-title" className={`${CARD} relative w-full max-w-lg max-h-[85vh] overflow-y-auto p-5`}>
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <h2 id="assign-title" className="font-semibold">{editing.name || editing.email}</h2>
                <p className="text-xs text-muted-foreground mt-0.5">{editing.email}</p>
              </div>
              <button type="button" onClick={() => setEditing(null)} className={btn.ghost} aria-label="Close">
                <X className="size-4" aria-hidden />
              </button>
            </div>

            <div className="flex items-start gap-2.5 rounded-xl bg-muted p-3 mb-4 text-sm text-muted-foreground">
              <Info className="size-4 shrink-0 mt-0.5" aria-hidden />
              <p>
                Someone holding several roles can do everything any of them allows. Saving signs
                them out, so the change takes effect the moment they sign back in.
              </p>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); save.mutate() }}>
              <div className="space-y-2">
                {(roles ?? []).map((r) => (
                  <label
                    key={r.id}
                    className="flex items-start gap-3 rounded-xl border border-border p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                  >
                    <input
                      type="checkbox"
                      className="size-4 mt-0.5 rounded border-border shrink-0"
                      checked={picked.has(r.id)}
                      onChange={() =>
                        setPicked((s) => {
                          const next = new Set(s)
                          if (next.has(r.id)) next.delete(r.id)
                          else next.add(r.id)
                          return next
                        })
                      }
                    />
                    <span className="min-w-0">
                      <span className="text-sm font-medium flex items-center gap-2">
                        {r.name}
                        {r.isSuperuser && (
                          <Chip className="bg-amber-100 text-amber-800 border-amber-200">unrestricted</Chip>
                        )}
                      </span>
                      <span className="text-xs text-muted-foreground">{r.description}</span>
                    </span>
                  </label>
                ))}
              </div>

              {picked.size === 0 && (
                <p className="text-xs text-amber-800 mt-3">
                  With no role, this person can sign in but reach nothing.
                </p>
              )}

              <div className="flex justify-end gap-2 mt-5 pt-4 border-t border-border">
                <button type="button" onClick={() => setEditing(null)} className={btn.secondary}>Cancel</button>
                <button type="submit" disabled={save.isPending} className={btn.primary}>
                  <Check className="size-4" aria-hidden />
                  {save.isPending ? 'Saving…' : 'Save roles'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
