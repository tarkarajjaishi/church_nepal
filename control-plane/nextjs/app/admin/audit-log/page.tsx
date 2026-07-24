'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { CalendarIcon, FilterIcon, DownloadIcon, XIcon, EyeIcon, Columns3Icon } from 'lucide-react'

// Mock data for demonstration
const mockAuditLogData = [
  {
    id: '1',
    timestamp: '2024-01-15T10:30:00Z',
    actor: 'admin@churchnepal.com',
    action: 'CREATE_USER',
    target_type: 'User',
    target_id: 'usr-123',
    ip_address: '192.168.1.1',
    user_agent: 'Mozilla/5.0...',
    metadata: { new_user_id: 'usr-123', role: 'member' },
  },
  {
    id: '2',
    timestamp: '2024-01-15T11:45:00Z',
    actor: 'pastor@churchnepal.com',
    action: 'UPDATE_EVENT',
    target_type: 'Event',
    target_id: 'evt-456',
    ip_address: '192.168.1.2',
    user_agent: 'Mozilla/5.0...',
    metadata: { event_id: 'evt-456', field: 'date', old_value: '2024-01-20', new_value: '2024-01-21' },
  },
  {
    id: '3',
    timestamp: '2024-01-15T12:00:00Z',
    actor: 'admin@churchnepal.com',
    action: 'DELETE_MINISTRY',
    target_type: 'Ministry',
    target_id: 'min-789',
    ip_address: '192.168.1.1',
    user_agent: 'Mozilla/5.0...',
    metadata: { ministry_id: 'min-789', name: 'Youth Ministry' },
  },
]

export default function AuditLogPage() {
  const [logs, setLogs] = useState(mockAuditLogData)
  const [filteredLogs, setFilteredLogs] = useState(mockAuditLogData)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [selectedLog, setSelectedLog] = useState<any>(null)
  
  // Filter states
  const [filters, setFilters] = useState({
    actor: '',
    action: '',
    target_type: '',
    ip_address: '',
    date_from: '',
    date_to: '',
  })
  
  // Saved views state
  const [savedViews, setSavedViews] = useState<{ id: string; name: string; filters: { actor?: string; action?: string; target_type?: string; ip_address?: string; date_from?: string; date_to?: string } }[]>([
    { id: 'view-1', name: 'All Actions', filters: {} },
    { id: 'view-2', name: 'Admin Only', filters: { actor: 'admin@churchnepal.com' } },
    { id: 'view-3', name: 'Recent Deletions', filters: { action: 'DELETE_' } },
  ])
  const [currentView, setCurrentView] = useState<string | null>(null)
  
  type VisibleColumnKeys = 'timestamp' | 'actor' | 'action' | 'target_type' | 'target_id' | 'ip_address';
// Column visibility
  const [visibleColumns, setVisibleColumns] = useState<Record<VisibleColumnKeys, boolean>>({
    timestamp: true,
    actor: true,
    action: true,
    target_type: true,
    target_id: true,
    ip_address: true,
  })

  // Apply filters when they change
  useEffect(() => {
    let result = [...logs]
    
    // Apply each filter conditionally
    if (filters.actor) {
      result = result.filter(log => log.actor.toLowerCase().includes(filters.actor.toLowerCase()))
    }
    if (filters.action) {
      result = result.filter(log => log.action.includes(filters.action))
    }
    if (filters.target_type) {
      result = result.filter(log => log.target_type.includes(filters.target_type))
    }
    if (filters.ip_address) {
      result = result.filter(log => log.ip_address.includes(filters.ip_address))
    }
    if (filters.date_from) {
      result = result.filter(log => new Date(log.timestamp) >= new Date(filters.date_from))
    }
    if (filters.date_to) {
      result = result.filter(log => new Date(log.timestamp) <= new Date(filters.date_to))
    }
    
    setFilteredLogs(result)
  }, [filters, logs])

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const clearFilters = () => {
    setFilters({
      actor: '',
      action: '',
      target_type: '',
      ip_address: '',
      date_from: '',
      date_to: '',
    })
    setCurrentView(null)
  }

const applySavedView = (viewId: string) => {
     const view = savedViews.find(v => v.id === viewId)
     if (view) {
       setFilters({
         actor: view.filters.actor ?? '',
         action: view.filters.action ?? '',
         target_type: view.filters.target_type ?? '',
         ip_address: view.filters.ip_address ?? '',
         date_from: view.filters.date_from ?? '',
         date_to: view.filters.date_to ?? '',
       })
       setCurrentView(viewId)
     }
   }

  const saveCurrentView = () => {
    const name = prompt('Enter name for this view:')
    if (name) {
      const newView = {
        id: `view-${Date.now()}`,
        name,
        filters: { ...filters },
      }
      setSavedViews([...savedViews, newView])
    }
  }

const exportToFormat = (format: 'csv' | 'json') => {
     if (format === 'csv') {
       const headers = Object.keys(visibleColumns).filter(col => visibleColumns[col as keyof typeof visibleColumns])
       const csvContent = [
         headers.join(','),
         ...filteredLogs.map(log => 
           headers.map(header => {
             const keyTyped = header as VisibleColumnKeys
             return `"${log[keyTyped] || ''}"`
           }).join(',')
         )
       ].join('\n')
       
       const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
       const link = document.createElement('a')
       const url = URL.createObjectURL(blob)
       link.setAttribute('href', url)
       link.setAttribute('download', `audit-log-${new Date().toISOString().split('T')[0]}.csv`)
       link.style.visibility = 'hidden'
       document.body.appendChild(link)
       link.click()
       document.body.removeChild(link)
     } else if (format === 'json') {
const filteredData = filteredLogs.map(log => {
         const filteredLog: Partial<typeof log> = {}
         Object.keys(visibleColumns).forEach(key => {
           const keyTyped = key as VisibleColumnKeys
           if (visibleColumns[keyTyped]) {
             filteredLog[keyTyped] = log[keyTyped]
           }
         })
         return filteredLog
       })
      
      const jsonStr = JSON.stringify(filteredData, null, 2)
      const blob = new Blob([jsonStr], { type: 'application/json' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `audit-log-${new Date().toISOString().split('T')[0]}.json`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const toggleColumnVisibility = (col: string) => {
    setVisibleColumns(prev => ({
      ...prev,
      [col]: !prev[col as keyof typeof visibleColumns]
    }))
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-[var(--text)]">Audit Log</h1>
        <div className="flex gap-2">
<DropdownMenu>
             <DropdownMenuTrigger>
               <Button variant="outline" size="sm">
                 <Columns3Icon className="w-4 h-4 mr-2" />
                 Columns
               </Button>
             </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-[var(--panel)] border-[var(--border)]">
              {Object.entries(visibleColumns).map(([col, visible]) => (
                <DropdownMenuItem key={col} onClick={() => toggleColumnVisibility(col)}>
                  <input
                    type="checkbox"
                    checked={visible}
                    onChange={() => {}}
                    className="mr-2"
                  />
                  {col.charAt(0).toUpperCase() + col.slice(1)}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          
<DropdownMenu>
             <DropdownMenuTrigger>
               <Button variant="outline" size="sm">
                 <DownloadIcon className="w-4 h-4 mr-2" />
                 Export
               </Button>
             </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-[var(--panel)] border-[var(--border)]">
              <DropdownMenuItem onClick={() => exportToFormat('csv')}>
                Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportToFormat('json')}>
                Export as JSON
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Filters Section */}
      <Card className="bg-[var(--panel)] border border-[var(--border)] rounded-xl p-5 mb-6">
        <div className="flex flex-wrap gap-4 mb-4">
          <Input
            placeholder="Actor email"
            value={filters.actor}
            onChange={(e) => handleFilterChange('actor', e.target.value)}
            className="bg-[var(--bg)] border-[var(--border-soft)] text-[var(--text)] min-w-[180px]"
          />
<Select value={filters.action} onValueChange={(value) => handleFilterChange('action', value)}>
             <SelectTrigger className="bg-[var(--bg)] border-[var(--border-soft)] text-[var(--text)] min-w-[180px]">
               <SelectValue />
             </SelectTrigger>
            <SelectContent className="bg-[var(--panel)] border-[var(--border)] text-[var(--text)]">
              <SelectItem value="CREATE_">Create actions</SelectItem>
              <SelectItem value="UPDATE_">Update actions</SelectItem>
              <SelectItem value="DELETE_">Delete actions</SelectItem>
              <SelectItem value="LOGIN">Login</SelectItem>
              <SelectItem value="LOGOUT">Logout</SelectItem>
            </SelectContent>
          </Select>
<Select value={filters.target_type} onValueChange={(value) => handleFilterChange('target_type', value)}>
             <SelectTrigger className="bg-[var(--bg)] border-[var(--border-soft)] text-[var(--text)] min-w-[180px]">
               <SelectValue />
             </SelectTrigger>
            <SelectContent className="bg-[var(--panel)] border-[var(--border)] text-[var(--text)]">
              <SelectItem value="User">User</SelectItem>
              <SelectItem value="Event">Event</SelectItem>
              <SelectItem value="Ministry">Ministry</SelectItem>
              <SelectItem value="Sermon">Sermon</SelectItem>
            </SelectContent>
          </Select>
          <Input
            placeholder="IP Address"
            value={filters.ip_address}
            onChange={(e) => handleFilterChange('ip_address', e.target.value)}
            className="bg-[var(--bg)] border-[var(--border-soft)] text-[var(--text)] min-w-[180px]"
          />
          <Input
            type="date"
            value={filters.date_from}
            onChange={(e) => handleFilterChange('date_from', e.target.value)}
            className="bg-[var(--bg)] border-[var(--border-soft)] text-[var(--text)] min-w-[150px]"
          />
          <Input
            type="date"
            value={filters.date_to}
            onChange={(e) => handleFilterChange('date_to', e.target.value)}
            className="bg-[var(--bg)] border-[var(--border-soft)] text-[var(--text)] min-w-[150px]"
          />
        </div>
        
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="text-sm text-[var(--muted)]">Saved Views:</span>
            {savedViews.map(view => (
              <Badge 
                key={view.id} 
                variant={currentView === view.id ? "default" : "secondary"}
                className={`cursor-pointer ${currentView === view.id ? 'bg-[var(--accent)]' : 'bg-[var(--accent-soft)]'}`}
                onClick={() => applySavedView(view.id)}
              >
                {view.name}
              </Badge>
            ))}
            <Button variant="outline" size="sm" onClick={saveCurrentView}>
              Save Current View
            </Button>
          </div>
          
          {(filters.actor || filters.action || filters.target_type || filters.ip_address || filters.date_from || filters.date_to) && (
            <Button variant="outline" size="sm" onClick={clearFilters} className="ml-2">
              <XIcon className="w-4 h-4 mr-1" />
              Clear Filters
            </Button>
          )}
        </div>
      </Card>

      {/* Results Count */}
      <div className="mb-4 text-[var(--muted)]">
        Showing {filteredLogs.length} of {logs.length} events
      </div>

      {/* Audit Log Table */}
      <Card className="bg-[var(--panel)] border border-[var(--border)] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--border-soft)]">
                {visibleColumns.timestamp && (
                  <th className="py-3 px-4 text-left text-[var(--muted)] text-sm font-medium">Timestamp</th>
                )}
                {visibleColumns.actor && (
                  <th className="py-3 px-4 text-left text-[var(--muted)] text-sm font-medium">Actor</th>
                )}
                {visibleColumns.action && (
                  <th className="py-3 px-4 text-left text-[var(--muted)] text-sm font-medium">Action</th>
                )}
                {visibleColumns.target_type && (
                  <th className="py-3 px-4 text-left text-[var(--muted)] text-sm font-medium">Target Type</th>
                )}
                {visibleColumns.target_id && (
                  <th className="py-3 px-4 text-left text-[var(--muted)] text-sm font-medium">Target ID</th>
                )}
                {visibleColumns.ip_address && (
                  <th className="py-3 px-4 text-left text-[var(--muted)] text-sm font-medium">IP Address</th>
                )}
                <th className="py-3 px-4 text-right text-[var(--muted)] text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log) => (
                <tr key={log.id} className="border-b border-[var(--border-soft)] hover:bg-[var(--bg)]">
                  {visibleColumns.timestamp && (
                    <td className="py-3 px-4 text-[var(--text)]">{formatDate(log.timestamp)}</td>
                  )}
                  {visibleColumns.actor && (
                    <td className="py-3 px-4 text-[var(--text)]">{log.actor}</td>
                  )}
                  {visibleColumns.action && (
                    <td className="py-3 px-4">
                      <Badge variant="outline" className="bg-[var(--accent-soft)] text-[var(--text)]">
                        {log.action}
                      </Badge>
                    </td>
                  )}
                  {visibleColumns.target_type && (
                    <td className="py-3 px-4 text-[var(--text)]">{log.target_type}</td>
                  )}
                  {visibleColumns.target_id && (
                    <td className="py-3 px-4 text-[var(--text)]">{log.target_id}</td>
                  )}
                  {visibleColumns.ip_address && (
                    <td className="py-3 px-4 text-[var(--text)]">{log.ip_address}</td>
                  )}
                  <td className="py-3 px-4 text-right">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => {
                        setSelectedLog(log)
                        setIsDrawerOpen(true)
                      }}
                    >
                      <EyeIcon className="w-4 h-4 text-[var(--muted)]" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Detail Drawer */}
      <Dialog open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-[var(--panel)] border-[var(--border)]">
          <DialogHeader>
            <DialogTitle className="text-[var(--text)]">Audit Event Details</DialogTitle>
          </DialogHeader>
          
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-[var(--muted)]">Timestamp</p>
                  <p className="text-[var(--text)]">{formatDate(selectedLog.timestamp)}</p>
                </div>
                <div>
                  <p className="text-sm text-[var(--muted)]">Actor</p>
                  <p className="text-[var(--text)]">{selectedLog.actor}</p>
                </div>
                <div>
                  <p className="text-sm text-[var(--muted)]">Action</p>
                  <p className="text-[var(--text)]">{selectedLog.action}</p>
                </div>
                <div>
                  <p className="text-sm text-[var(--muted)]">Target Type</p>
                  <p className="text-[var(--text)]">{selectedLog.target_type}</p>
                </div>
                <div>
                  <p className="text-sm text-[var(--muted)]">Target ID</p>
                  <p className="text-[var(--text)]">{selectedLog.target_id}</p>
                </div>
                <div>
                  <p className="text-sm text-[var(--muted)]">IP Address</p>
                  <p className="text-[var(--text)]">{selectedLog.ip_address}</p>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-[var(--muted)]">User Agent</p>
                <p className="text-[var(--text)] break-all">{selectedLog.user_agent}</p>
              </div>
              
              <div>
                <p className="text-sm text-[var(--muted)]">Metadata</p>
                <pre className="bg-[var(--bg)] p-3 rounded-md text-xs text-[var(--text)] overflow-x-auto">
                  {JSON.stringify(selectedLog.metadata, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
