'use client'

import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  Shield, ShieldAlert, Plus, X, Save, Trash2, Users, Check, Info, Lock,
} from 'lucide-react'
import { rolesApi, describe, SYSTEM_ADMIN, type Role } from '@/lib/roles/api'
import {
  CARD, PageHeader, EmptyState, ErrorState, TableSkeleton, Chip, btn, field, Label,
} from '@/components/offerings/ui'

export default function RolesPage() {
  const qc = useQueryClient()
  const [editing, setEditing] = useState<Role | null>(null)
  const [checked, setChecked] = useState<Set<string>>(new Set())
  const [creating, setCreating] = useState(false)
  const [f, setF] = useState({ name: '', description: '' })

  const { data: roles, isLoading, error, refetch } = useQuery({
    queryKey: ['roles'],
    queryFn: rolesApi.roles,
  })
  const { data: catalogue } = useQuery({
    queryKey: ['permission-catalogue'],
    queryFn: rolesApi.catalogue,
  })

  useEffect(() => {
    if (editing) setChecked(new Set(editing.permissions))
  }, [editing])

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['roles'] })
    qc.invalidateQueries({ queryKey: ['role-assignments'] })
    qc.invalidateQueries({ queryKey: ['my-access'] })
  }

  const save = useMutation({
    mutationFn: () => rolesApi.setPermissions(editing!.id, [...checked]),
    onSuccess: () => {
      invalidate()
      toast.success(`${editing!.name} updated — everyone holding it is signed out`)
      setEditing(null)
    },
    onError: (e: Error) => toast.error(e.message || 'Could not save this role'),
  })

  const create = useMutation({
    mutationFn: () =>
      rolesApi.createRole({
        name: f.name.trim(),
        description: f.description.trim(),
        permissions: ['dashboard.view'],
      }),
    onSuccess: () => {
      invalidate()
      toast.success('Role created — now choose what it can do')
      setCreating(false)
      setF({ name: '', description: '' })
    },
    onError: (e: Error) => toast.error(e.message || 'Could not create this role'),
  })

  const remove = useMutation({
    mutationFn: (id: string) => rolesApi.deleteRole(id),
    onSuccess: () => { invalidate(); toast.success('Role deleted') },
    // Refusals here are deliberate — a built-in role, or one people still
    // hold. Show the reason rather than a generic failure.
    onError: (e: Error) => toast.error(e.message || 'Could not delete this role'),
  })

  // Grouped for the editor so 16 checkboxes read as five decisions.
  const groups = (catalogue ?? []).reduce<Record<string, typeof catalogue>>((acc, p) => {
    ;(acc[p.module] ??= []).push(p)
    return acc
  }, {})

  const toggle = (code: string) =>
    setChecked((s) => {
      const next = new Set(s)
      if (next.has(code)) next.delete(code)
      else next.add(code)
      return next
    })

  return (
    <>
      <PageHeader
        title="Roles"
        subtitle="What each kind of person on the team is allowed to reach"
        actions={
          <button type="button" onClick={() => setCreating((v) => !v)} className={btn.primary}>
            <Plus className="size-4" aria-hidden /> New role
          </button>
        }
      />

      <div className="rounded-2xl border border-border bg-muted p-4 mb-4 flex items-start gap-2.5 text-sm text-muted-foreground">
        <Info className="size-4 shrink-0 mt-0.5" aria-hidden />
        <p>
          Permissions are checked on the server for every request, so a role decides what a
          person can actually reach — not just what they are shown. Changing a role signs its
          holders out, and their next sign-in has the rights you just gave them.
        </p>
      </div>

      {creating && (
        <section className={`${CARD} p-4 sm:p-5 mb-4`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">New role</h2>
            <button type="button" onClick={() => setCreating(false)} className={btn.ghost} aria-label="Close">
              <X className="size-4" aria-hidden />
            </button>
          </div>
          <form onSubmit={(e) => { e.preventDefault(); if (f.name.trim()) create.mutate() }} className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label htmlFor="r-name" required>Name</Label>
              <input id="r-name" className={field} placeholder="Sunday School Lead" value={f.name} onChange={(e) => setF((s) => ({ ...s, name: e.target.value }))} />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="r-desc">What this person does</Label>
              <input id="r-desc" className={field} value={f.description} onChange={(e) => setF((s) => ({ ...s, description: e.target.value }))} />
            </div>
            <div className="sm:col-span-3 flex justify-end gap-2">
              <button type="button" onClick={() => setCreating(false)} className={btn.secondary}>Cancel</button>
              <button type="submit" disabled={!f.name.trim() || create.isPending} className={btn.primary}>
                <Save className="size-4" aria-hidden />
                {create.isPending ? 'Creating…' : 'Create role'}
              </button>
            </div>
          </form>
        </section>
      )}

      <div className={`${CARD} overflow-hidden`}>
        {error ? (
          <ErrorState message={(error as Error).message} onRetry={() => refetch()} />
        ) : isLoading ? (
          <TableSkeleton cols={4} />
        ) : !roles?.length ? (
          <EmptyState icon={Shield} title="No roles" subtitle="Create one to start limiting what people can reach." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10 bg-card/95 backdrop-blur border-b border-border">
                <tr>
                  {['Role', 'Can reach', 'People', ''].map((h, i) => (
                    <th key={i} scope="col" className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {roles.map((r) => (
                  <tr key={r.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {r.isSuperuser
                          ? <ShieldAlert className="size-4 shrink-0 text-amber-700" aria-hidden />
                          : <Shield className="size-4 shrink-0 text-muted-foreground" aria-hidden />}
                        <span className="font-medium">{r.name}</span>
                        {r.isSystem && (
                          <Chip className="bg-muted text-muted-foreground border-border">
                            <Lock className="size-3" aria-hidden /> built-in
                          </Chip>
                        )}
                      </div>
                      {r.description && <p className="text-xs text-muted-foreground mt-0.5 max-w-[32rem]">{r.description}</p>}
                    </td>
                    <td className="px-4 py-3">
                      {r.permissions.includes(SYSTEM_ADMIN)
                        ? <Chip className="bg-amber-100 text-amber-800 border-amber-200">Everything</Chip>
                        : r.permissions.length === 0
                        ? <Chip className="bg-gray-100 text-gray-700 border-gray-200">Nothing</Chip>
                        : <span className="text-muted-foreground">{describe(r)}</span>}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-muted-foreground">
                      <span className="inline-flex items-center gap-1.5">
                        <Users className="size-3.5" aria-hidden />{r.userCount}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button type="button" onClick={() => setEditing(r)} className={btn.secondary}>Edit</button>
                      {!r.isSystem && (
                        <button
                          type="button"
                          onClick={() => remove.mutate(r.id)}
                          disabled={remove.isPending}
                          className={`${btn.ghost} ml-1`}
                          aria-label={`Delete ${r.name}`}
                        >
                          <Trash2 className="size-3.5" aria-hidden />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Permission editor */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button type="button" className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={() => setEditing(null)} aria-label="Cancel" />
          <div role="dialog" aria-modal="true" aria-labelledby="perm-title" className={`${CARD} relative w-full max-w-2xl max-h-[85vh] overflow-y-auto p-5`}>
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <h2 id="perm-title" className="font-semibold">{editing.name}</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {editing.userCount} person{editing.userCount === 1 ? '' : 's'} hold this role
                </p>
              </div>
              <button type="button" onClick={() => setEditing(null)} className={btn.ghost} aria-label="Close">
                <X className="size-4" aria-hidden />
              </button>
            </div>

            {editing.isSuperuser && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 mb-4 text-sm text-amber-900">
                This role always keeps unrestricted access, whatever is ticked below. Removing it
                would leave nobody able to put it back.
              </div>
            )}

            <form onSubmit={(e) => { e.preventDefault(); save.mutate() }}>
              <div className="space-y-5">
                {Object.entries(groups).map(([module, perms]) => (
                  <fieldset key={module}>
                    <legend className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/70 mb-2">
                      {module}
                    </legend>
                    <div className="space-y-2">
                      {perms!.map((p) => (
                        <label
                          key={p.code}
                          className="flex items-start gap-3 rounded-xl border border-border p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                        >
                          <input
                            type="checkbox"
                            className="size-4 mt-0.5 rounded border-border shrink-0"
                            checked={checked.has(p.code)}
                            onChange={() => toggle(p.code)}
                          />
                          <span className="min-w-0">
                            <span className="text-sm font-medium block">
                              {p.label}
                              {!p.enforced && (
                                <Chip className="ml-2 bg-red-100 text-red-800 border-red-200">not enforced</Chip>
                              )}
                            </span>
                            <span className="text-xs text-muted-foreground">{p.description}</span>
                          </span>
                        </label>
                      ))}
                    </div>
                  </fieldset>
                ))}
              </div>

              <div className="flex items-center justify-between gap-3 mt-5 pt-4 border-t border-border">
                <p className="text-xs text-muted-foreground">
                  {checked.size} of {catalogue?.length ?? 0} selected
                </p>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setEditing(null)} className={btn.secondary}>Cancel</button>
                  <button type="submit" disabled={save.isPending} className={btn.primary}>
                    <Check className="size-4" aria-hidden />
                    {save.isPending ? 'Saving…' : 'Save role'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
