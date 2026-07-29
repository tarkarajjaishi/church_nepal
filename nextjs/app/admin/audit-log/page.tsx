'use client'

import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/admin/api'
import { Shield, Filter, Search, Download } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Loading, EmptyState, PaginationControls } from '@/components/LoadingStates'
import { API_ORIGIN } from '@/lib/apiBase'
import { toast } from 'sonner'

const entityColors: Record<string, string> = {
  user: 'bg-blue-100 text-blue-800',
  person: 'bg-green-100 text-green-800',
  donation: 'bg-purple-100 text-purple-800',
  offering: 'bg-orange-100 text-orange-800',
  event: 'bg-yellow-100 text-yellow-800',
  broadcast: 'bg-pink-100 text-pink-800',
  form: 'bg-cyan-100 text-cyan-800',
  settings: 'bg-gray-100 text-gray-800',
  sermon: 'bg-indigo-100 text-indigo-800',
  ministry: 'bg-teal-100 text-teal-800',
  leader: 'bg-red-100 text-red-800',
  gallery: 'bg-pink-100 text-pink-800',
  notice: 'bg-amber-100 text-amber-800',
  service_time: 'bg-lime-100 text-lime-800',
  verse: 'bg-violet-100 text-violet-800',
  campaign: 'bg-emerald-100 text-emerald-800',
  content_block: 'bg-sky-100 text-sky-800',
  todo: 'bg-cyan-100 text-cyan-800',
  blog: 'bg-fuchsia-100 text-fuchsia-800',
  service: 'bg-rose-100 text-rose-800',
  team: 'bg-slate-100 text-slate-800',
  portfolio: 'bg-orange-100 text-orange-800',
  contact_info: 'bg-blue-100 text-blue-800',
  contact_message: 'bg-purple-100 text-purple-800',
  group: 'bg-green-100 text-green-800',
  household: 'bg-yellow-100 text-yellow-800',
  tag: 'bg-gray-100 text-gray-800',
  member_note: 'bg-pink-100 text-pink-800',
  member: 'bg-teal-100 text-teal-800',
  volunteer_team: 'bg-indigo-100 text-indigo-800',
  volunteer_shift: 'bg-amber-100 text-amber-800',
  volunteer_assignment: 'bg-lime-100 text-lime-800',
  fund: 'bg-emerald-100 text-emerald-800',
  pledge: 'bg-violet-100 text-violet-800',
  member_application: 'bg-red-100 text-red-800',
  prayer_request: 'bg-sky-100 text-sky-800',
}

const actionColors: Record<string, string> = {
  create: 'bg-green-100 text-green-800',
  update: 'bg-blue-100 text-blue-800',
  delete: 'bg-red-100 text-red-800',
  approve: 'bg-emerald-100 text-emerald-800',
  reject: 'bg-rose-100 text-rose-800',
  toggle: 'bg-yellow-100 text-yellow-800',
  reorder: 'bg-gray-100 text-gray-800',
  send: 'bg-purple-100 text-purple-800',
  refund: 'bg-orange-100 text-orange-800',
  import: 'bg-cyan-100 text-cyan-800',
  bulk: 'bg-indigo-100 text-indigo-800',
  login: 'bg-yellow-100 text-yellow-800',
}

export default function AuditLogPage() {
  const [entityFilter, setEntityFilter] = useState('all')
  const [userFilter, setUserFilter] = useState('')
  const [actionFilter, setActionFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(20)

  const params = useMemo(() => {
    const p = new URLSearchParams()
    p.set('page', String(page))
    p.set('per_page', String(perPage))
    if (entityFilter !== 'all') p.set('entity_type', entityFilter)
    if (userFilter) p.set('user_email', userFilter)
    if (actionFilter !== 'all') p.set('action', actionFilter)
    return p
  }, [entityFilter, userFilter, actionFilter, page, perPage])

  const { data, isLoading } = useQuery({
    queryKey: ['audit-log', entityFilter, userFilter, actionFilter, page, perPage],
    queryFn: () => api.get(`/audit-log?${params.toString()}`).then(r => r.data),
  })

  const entries = (data?.data ?? []) as any[]
  const total = data?.total ?? 0
  const currentPage = data?.page ?? page
  const totalPages = data?.total_pages ?? data?.totalPages ?? 1

  const entityTypes = useMemo(() => {
    const types = new Set<string>()
    entries.forEach((e) => { if (e.entityType) types.add(e.entityType) })
    return Array.from(types)
  }, [entries])

  const actions = useMemo(() => {
    const acts = new Set<string>()
    entries.forEach((e) => { if (e.action) acts.add(e.action) })
    return Array.from(acts)
  }, [entries])

  const filtered = useMemo(() => {
    if (!searchQuery) return entries
    const q = searchQuery.toLowerCase()
    return entries.filter((e: any) =>
      !q ||
      (e.details && JSON.stringify(e.details).toLowerCase().includes(q)) ||
      e.userEmail?.toLowerCase().includes(q) ||
      e.entityType?.toLowerCase().includes(q) ||
      e.action?.toLowerCase().includes(q)
    )
  }, [entries, searchQuery])

  const exportCSV = async () => {
    const exportParams = new URLSearchParams()
    if (entityFilter !== 'all') exportParams.set('entity_type', entityFilter)
    if (userFilter) exportParams.set('user_email', userFilter)
    if (actionFilter !== 'all') exportParams.set('action', actionFilter)

    const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null
    try {
      const res = await fetch(`${API_ORIGIN}/api/audit-log/export-csv?${exportParams.toString()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!res.ok) {
        toast.error('Failed to export CSV')
        return
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `audit-log-${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('CSV exported successfully')
    } catch {
      toast.error('Failed to export CSV')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#0b3c5d]">Audit Log</h1>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Shield className="size-4" />
            <span>{total} entries</span>
          </div>
          <Button variant="outline" size="sm" onClick={exportCSV}>
            <Download className="size-4 mr-1.5" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Filter className="size-4 text-muted-foreground" />
              <Label className="text-sm">Filters:</Label>
            </div>
            <Select value={entityFilter} onValueChange={setEntityFilter}>
              <SelectTrigger className="w-40"><SelectValue placeholder="All entities" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Entities</SelectItem>
                {entityTypes.map(t => (
                  <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-40"><SelectValue placeholder="All actions" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                {actions.map(a => (
                  <SelectItem key={a} value={a}>{a.charAt(0).toUpperCase() + a.slice(1)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input value={userFilter} onChange={e => setUserFilter(e.target.value)} placeholder="Filter by user email..." className="w-64" />
            <div className="relative">
              <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search..." className="pl-9 w-64" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Log Table */}
      <Card>
        <CardContent>
          {isLoading ? (
            <Loading />
          ) : filtered.length === 0 ? (
            <EmptyState icon={<Shield className="size-10" />} title="No audit entries found" description="Actions performed in the admin will appear here." />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="p-2">Timestamp</th>
                      <th className="p-2">User</th>
                      <th className="p-2">Action</th>
                      <th className="p-2">Entity</th>
                      <th className="p-2">Entity ID</th>
                      <th className="p-2">Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((entry: any) => (
                      <tr key={entry.id} className="border-b last:border-0 hover:bg-muted/50">
                        <td className="p-2 text-muted-foreground text-xs whitespace-nowrap">
                          {entry.createdAt ? new Date(entry.createdAt).toLocaleString() : '-'}
                        </td>
                        <td className="p-2 font-medium text-xs">{entry.userEmail || '-'}</td>
                        <td className="p-2">
                          <Badge variant="secondary" className={`text-xs ${actionColors[entry.action] || 'bg-gray-100 text-gray-800'}`}>
                            {entry.action}
                          </Badge>
                        </td>
                        <td className="p-2">
                          <Badge variant="secondary" className={`text-xs ${entityColors[entry.entityType] || 'bg-gray-100 text-gray-800'}`}>
                            {entry.entityType}
                          </Badge>
                        </td>
                        <td className="p-2 text-xs font-mono">{entry.entityId ? entry.entityId.slice(0, 8) + '...' : '-'}</td>
                        <td className="p-2 text-muted-foreground text-xs max-w-[300px] truncate">
                          {entry.details ? JSON.stringify(entry.details) : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <PaginationControls
                page={currentPage}
                perPage={perPage}
                total={total}
                totalPages={totalPages}
                onPageChange={(p) => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
              />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
