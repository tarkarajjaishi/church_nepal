'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Users, Plus, X, Save, Trash2, Search, Star } from 'lucide-react'
import { worshipApi, VOICE_TYPES, EXPERIENCE_LEVELS, type WorshipMember } from '@/lib/worship/api'
import {
  CARD, PageHeader, EmptyState, TableSkeleton, Chip, btn, field, Label,
} from '@/components/offerings/ui'

export default function WorshipTeamPage() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [showInactive, setShowInactive] = useState(false)
  const [editing, setEditing] = useState<WorshipMember | 'new' | null>(null)

  const { data: roles } = useQuery({
    queryKey: ['worship-roles'],
    queryFn: worshipApi.roles,
    staleTime: 300_000,
  })
  const { data: members, isLoading } = useQuery({
    queryKey: ['worship-members', search, roleFilter, showInactive],
    queryFn: () =>
      worshipApi.members({
        search: search || undefined,
        roleId: roleFilter || undefined,
        // Undefined means "any" — the API only filters when the flag is present.
        active: showInactive ? undefined : true,
      }),
    placeholderData: (p) => p,
  })

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['worship-members'] })
    qc.invalidateQueries({ queryKey: ['worship-dashboard'] })
  }

  const remove = useMutation({
    mutationFn: (id: string) => worshipApi.deleteMember(id),
    onSuccess: (res: { deactivated?: boolean; reason?: string }) => {
      invalidate()
      // The API refuses to delete someone who appears in service history and
      // deactivates instead — say so rather than claiming a delete happened.
      if (res.deactivated) toast.info(res.reason ?? 'Deactivated because they appear in past services')
      else toast.success('Removed from the team')
    },
    onError: (e: Error) => toast.error(e.message),
  })

  return (
    <>
      <PageHeader
        title="Worship Team"
        subtitle={members ? `${members.length} member${members.length === 1 ? '' : 's'}` : undefined}
        actions={
          <button type="button" onClick={() => setEditing('new')} className={btn.primary}>
            <Plus className="size-4" aria-hidden /> Add Member
          </button>
        }
      />

      <div className={`${CARD} p-3 sm:p-4 mb-4 flex flex-wrap items-center gap-2`}>
        <div className="relative flex-1 min-w-[12rem]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" aria-hidden />
          <input
            type="search"
            className={`${field} pl-9`}
            placeholder="Search by name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search team"
          />
        </div>
        <select
          className={`${field} w-auto`}
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          aria-label="Filter by role"
        >
          <option value="">All roles</option>
          {(roles ?? []).map((r) => (
            <option key={r.id} value={r.id}>{r.name}</option>
          ))}
        </select>
        <label className="inline-flex items-center gap-2 cursor-pointer text-sm">
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
            className="size-4 rounded border-border accent-[var(--church-blue)]"
          />
          Include inactive
        </label>
      </div>

      <div className={`${CARD} overflow-hidden`}>
        {isLoading ? (
          <TableSkeleton cols={5} />
        ) : !members?.length ? (
          <EmptyState
            icon={Users}
            title="No team members"
            subtitle={search || roleFilter ? 'Try clearing the filters.' : 'Add musicians and tech volunteers.'}
            action={
              <button type="button" onClick={() => setEditing('new')} className={btn.primary}>
                Add Member
              </button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10 bg-card/95 backdrop-blur border-b border-border">
                <tr>
                  {['Name', 'Roles', 'Voice', 'Experience', 'Contact', 'Status', ''].map((h) => (
                    <th key={h} scope="col" className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {members.map((m) => (
                  <tr key={m.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => setEditing(m)}
                        className="inline-flex items-center gap-2 font-medium hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                      >
                        {m.isLeader && <Star className="size-3.5 fill-amber-400 text-amber-500" aria-label="Leader" />}
                        {m.name}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex flex-wrap gap-1">
                        {m.roles.length ? (
                          m.roles.map((r) => (
                            <Chip key={r} className="bg-muted text-foreground border-border">{r}</Chip>
                          ))
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground capitalize">
                      {m.voiceType === 'none' ? '—' : m.voiceType}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground capitalize">{m.experience}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {[m.phone, m.email].filter(Boolean).join(' · ') || '—'}
                    </td>
                    <td className="px-4 py-3">
                      {m.isActive ? (
                        <Chip className="bg-green-100 text-green-800 border-green-200">Active</Chip>
                      ) : (
                        <Chip className="bg-gray-100 text-gray-700 border-gray-200">Inactive</Chip>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`Remove ${m.name} from the team?`)) remove.mutate(m.id)
                        }}
                        className={btn.ghost}
                        aria-label={`Remove ${m.name}`}
                      >
                        <Trash2 className="size-3.5 text-destructive" aria-hidden />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editing && (
        <MemberEditor
          member={editing === 'new' ? null : editing}
          roles={roles ?? []}
          onClose={() => setEditing(null)}
          onSaved={() => {
            invalidate()
            setEditing(null)
          }}
        />
      )}
    </>
  )
}

function MemberEditor({
  member,
  roles,
  onClose,
  onSaved,
}: {
  member: WorshipMember | null
  roles: { id: string; name: string; category: string }[]
  onClose: () => void
  onSaved: () => void
}) {
  const [f, setF] = useState({
    name: member?.name ?? '',
    phone: member?.phone ?? '',
    email: member?.email ?? '',
    voiceType: member?.voiceType ?? 'none',
    experience: member?.experience ?? 'intermediate',
    emergencyContact: member?.emergencyContact ?? '',
    emergencyPhone: member?.emergencyPhone ?? '',
    notes: member?.notes ?? '',
    isLeader: member?.isLeader ?? false,
    isActive: member?.isActive ?? true,
    roleIds: member?.roleIds ?? ([] as string[]),
  })
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((s) => ({ ...s, [k]: v }))

  const toggleRole = (id: string) =>
    set('roleIds', f.roleIds.includes(id) ? f.roleIds.filter((r) => r !== id) : [...f.roleIds, id])

  const save = useMutation({
    mutationFn: () => {
      const body = {
        name: f.name.trim(),
        phone: f.phone.trim(),
        email: f.email.trim(),
        voice_type: f.voiceType,
        experience: f.experience,
        emergency_contact: f.emergencyContact.trim(),
        emergency_phone: f.emergencyPhone.trim(),
        notes: f.notes.trim(),
        is_leader: f.isLeader,
        is_active: f.isActive,
        role_ids: f.roleIds,
      }
      return member ? worshipApi.updateMember(member.id, body) : worshipApi.createMember(body)
    },
    onSuccess: () => {
      toast.success(member ? 'Member updated' : 'Member added')
      onSaved()
    },
    onError: (e: Error) => toast.error(e.message || 'Could not save this member'),
  })

  // Grouped by instrument family so a 21-item list reads as a few short ones.
  const byCategory = roles.reduce<Record<string, typeof roles>>((acc, r) => {
    ;(acc[r.category] ||= []).push(r)
    return acc
  }, {})

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={member ? `Edit ${member.name}` : 'Add team member'}
    >
      <button type="button" className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={onClose} aria-label="Close" />
      <div className="relative w-full sm:max-w-2xl max-h-[90dvh] overflow-y-auto rounded-t-2xl sm:rounded-2xl bg-card border border-border shadow-2xl">
        <div className="sticky top-0 z-10 bg-card/95 backdrop-blur p-5 border-b border-border flex items-center justify-between">
          <h2 className="font-semibold">{member ? 'Edit member' : 'Add team member'}</h2>
          <button type="button" onClick={onClose} className={btn.ghost} aria-label="Close">
            <X className="size-4" aria-hidden />
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (f.name.trim()) save.mutate()
          }}
          className="p-5 space-y-4"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="m-name" required>Name</Label>
              <input id="m-name" className={field} value={f.name} onChange={(e) => set('name', e.target.value)} />
            </div>
            <div>
              <Label htmlFor="m-phone">Phone</Label>
              <input id="m-phone" className={field} value={f.phone} onChange={(e) => set('phone', e.target.value)} />
            </div>
            <div>
              <Label htmlFor="m-email">Email</Label>
              <input id="m-email" type="email" className={field} value={f.email} onChange={(e) => set('email', e.target.value)} />
            </div>
            <div>
              <Label htmlFor="m-voice">Voice type</Label>
              <select id="m-voice" className={field} value={f.voiceType} onChange={(e) => set('voiceType', e.target.value)}>
                {VOICE_TYPES.map((v) => (
                  <option key={v} value={v}>{v === 'none' ? 'Not a vocalist' : v}</option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="m-exp">Experience</Label>
              <select id="m-exp" className={field} value={f.experience} onChange={(e) => set('experience', e.target.value)}>
                {EXPERIENCE_LEVELS.map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
            <div>
              <Label htmlFor="m-ec" hint="Who to call if something happens">Emergency contact</Label>
              <input id="m-ec" className={field} value={f.emergencyContact} onChange={(e) => set('emergencyContact', e.target.value)} />
            </div>
            <div>
              <Label htmlFor="m-ep">Emergency phone</Label>
              <input id="m-ep" className={field} value={f.emergencyPhone} onChange={(e) => set('emergencyPhone', e.target.value)} />
            </div>
          </div>

          <div>
            <Label hint="Everything they can play or operate">Roles</Label>
            <div className="space-y-3">
              {Object.entries(byCategory).map(([cat, rs]) => (
                <div key={cat}>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1.5">{cat}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {rs.map((r) => {
                      const on = f.roleIds.includes(r.id)
                      return (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => toggleRole(r.id)}
                          aria-pressed={on}
                          className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                            on
                              ? 'bg-primary text-primary-foreground border-primary'
                              : 'bg-card text-muted-foreground border-border hover:bg-muted'
                          }`}
                        >
                          {r.name}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="m-notes">Notes</Label>
            <textarea id="m-notes" rows={2} className={`${field} py-2 resize-y`} value={f.notes} onChange={(e) => set('notes', e.target.value)} />
          </div>

          <div className="flex flex-wrap gap-4">
            <label className="inline-flex items-center gap-2 cursor-pointer text-sm">
              <input
                type="checkbox"
                checked={f.isLeader}
                onChange={(e) => set('isLeader', e.target.checked)}
                className="size-4 rounded border-border accent-[var(--church-blue)]"
              />
              Worship leader
            </label>
            <label className="inline-flex items-center gap-2 cursor-pointer text-sm">
              <input
                type="checkbox"
                checked={f.isActive}
                onChange={(e) => set('isActive', e.target.checked)}
                className="size-4 rounded border-border accent-[var(--church-blue)]"
              />
              Active
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className={btn.secondary}>Cancel</button>
            <button type="submit" disabled={!f.name.trim() || save.isPending} className={btn.primary}>
              <Save className="size-4" aria-hidden />
              {save.isPending ? 'Saving…' : member ? 'Save changes' : 'Add member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
