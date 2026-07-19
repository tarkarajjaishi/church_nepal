'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/admin/api'
import { Shield, Filter, Search } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loading, EmptyState } from '@/components/LoadingStates'

const entityColors: Record<string, string> = {
  user: 'bg-blue-100 text-blue-800',
  person: 'bg-green-100 text-green-800',
  donation: 'bg-purple-100 text-purple-800',
  offering: 'bg-orange-100 text-orange-800',
  event: 'bg-yellow-100 text-yellow-800',
  broadcast: 'bg-pink-100 text-pink-800',
  form: 'bg-cyan-100 text-cyan-800',
  settings: 'bg-gray-100 text-gray-800',
}

const actionColors: Record<string, string> = {
  create: 'bg-green-100 text-green-800',
  update: 'bg-blue-100 text-blue-800',
  delete: 'bg-red-100 text-red-800',
  login: 'bg-yellow-100 text-yellow-800',
  send: 'bg-purple-100 text-purple-800',
}

export default function AuditLogPage() {
  const [entityFilter, setEntityFilter] = useState('all')
  const [userFilter, setUserFilter] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  const params = new URLSearchParams()
  if (entityFilter !== 'all') params.set('entity_type', entityFilter)
  if (userFilter) params.set('user_email', userFilter)
  const qs = params.toString()

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['audit-log', entityFilter, userFilter],
    queryFn: () => api.get(`/audit-log${qs ? '?' + qs : ''}`).then(r => r.data),
  })

  const filtered = entries.filter((e: any) =>
    !searchQuery ||
    e.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.userEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.entityType?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const entityTypes: string[] = [...new Set(entries.map((e: any) => e.entityType).filter(Boolean))] as string[]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#0b3c5d]">Audit Log</h1>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Shield className="size-4" />
          <span>{entries.length} entries</span>
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
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="p-2">Timestamp</th>
                    <th className="p-2">User</th>
                    <th className="p-2">Action</th>
                    <th className="p-2">Entity</th>
                    <th className="p-2">Description</th>
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
                      <td className="p-2 text-muted-foreground text-xs max-w-[300px] truncate">{entry.description || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
