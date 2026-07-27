'use client'

import { useState } from 'react'
import { useGivingSummary, usePeopleSummary } from '@/lib/hooks'
import { DollarSign, Users, TrendingUp, BarChart3, ArrowUpRight, ArrowDownRight, FileDown, Calendar, ClipboardCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import { Loading, EmptyState, ErrorState } from '@/components/LoadingStates'
import { toast } from 'sonner'

const COLORS = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444', '#EC4899', '#06B6D4', '#84CC16']

export default function ReportsPage() {
  const [tab, setTab] = useState<'giving' | 'people' | 'attendance'>('giving')

  const { data: givingSummary = {}, isLoading: givingLoading, isError: givingError, refetch: refetchGiving } = useGivingSummary()
  const { data: peopleSummary = {}, isLoading: peopleLoading, isError: peopleError, refetch: refetchPeople } = usePeopleSummary()

  const monthlyData = givingSummary.monthlyTrend || []
  const byTypeData = givingSummary.byType || []
  const topDonors = givingSummary.topDonors || []
  const statusDistribution = peopleSummary.statusDistribution || []
  const membershipSummary = peopleSummary.membership || {}

  const exportToCSV = () => {
    if (tab === 'giving') {
      const headers = ['Month', 'Total']
      const rows = monthlyData.map((m: any) => [m.month, m.total])
      const csvContent = [headers, ...rows].map(e => e.join(',')).join('\n')
      downloadFile(csvContent, 'giving-report.csv', 'text/csv')
    } else if (tab === 'people') {
      const headers = ['Status', 'Count']
      const rows = statusDistribution.map((s: any) => [s.status, s.count])
      const csvContent = [headers, ...rows].map(e => e.join(',')).join('\n')
      downloadFile(csvContent, 'people-report.csv', 'text/csv')
    }
    toast.success('Report exported successfully')
  }

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#0b3c5d]">Reports</h1>
        <Button variant="outline" size="sm" onClick={exportToCSV}>
          <FileDown className="size-4 mr-1.5" />
          Export CSV
        </Button>
      </div>

      {/* Tab Bar */}
      <div className="flex gap-2 border-b pb-2">
        {[
          { key: 'giving' as const, label: 'Giving', icon: DollarSign },
          { key: 'people' as const, label: 'People', icon: Users },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${
              tab === t.key ? 'bg-church-blue text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}>
            <t.icon className="size-4" /> {t.label}
          </button>
        ))}
      </div>

      {/* Giving Tab */}
      {tab === 'giving' && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Giving', value: `Rs ${(givingSummary.totalGiving || 0).toLocaleString()}`, change: givingSummary.givingChange, icon: DollarSign, color: 'bg-green-500' },
              { label: 'Total Donors', value: givingSummary.totalDonors || 0, change: givingSummary.donorChange, icon: Users, color: 'bg-blue-500' },
              { label: 'Average Gift', value: `Rs ${(givingSummary.averageGift || 0).toLocaleString()}`, icon: TrendingUp, color: 'bg-purple-500' },
              { label: 'This Month', value: `Rs ${(givingSummary.thisMonth || 0).toLocaleString()}`, icon: BarChart3, color: 'bg-orange-500' },
            ].map(({ label, value, change, icon: Icon, color }) => (
              <Card key={label}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`size-10 rounded-lg ${color} flex items-center justify-center text-white`}>
                      <Icon className="size-5" />
                    </div>
                    <div>
                      <div className="text-xl font-bold">{value}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        {label}
                        {change !== undefined && (
                          <span className={change >= 0 ? 'text-green-600' : 'text-red-600'}>
                            {change >= 0 ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
                            {Math.abs(change)}%
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Monthly Trend Chart */}
            <Card>
              <CardHeader><CardTitle className="text-base">Monthly Giving Trend</CardTitle></CardHeader>
              <CardContent>
                {givingLoading ? (
                  <div className="h-64 flex items-center justify-center"><Loading /></div>
                ) : givingError ? (
                  <ErrorState message="Failed to load giving report" onRetry={() => refetchGiving()} />
                ) : monthlyData.length === 0 ? (
                  <EmptyState icon={<BarChart3 className="size-8" />} title="No giving data yet" description="Giving trends appear here once gifts are recorded." />
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip formatter={(val: number) => [`Rs ${val.toLocaleString()}`, 'Amount']} />
                      <Line type="monotone" dataKey="total" stroke="#3B82F6" strokeWidth={2} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* By Type Pie Chart */}
            <Card>
              <CardHeader><CardTitle className="text-base">Giving by Type</CardTitle></CardHeader>
              <CardContent>
                {givingLoading ? (
                  <div className="h-64 flex items-center justify-center"><Loading /></div>
                ) : givingError ? (
                  <ErrorState message="Failed to load giving report" onRetry={() => refetchGiving()} />
                ) : byTypeData.length === 0 ? (
                  <EmptyState icon={<BarChart3 className="size-8" />} title="No giving data yet" description="Giving by type appears here once gifts are recorded." />
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie data={byTypeData} dataKey="total" nameKey="type" cx="50%" cy="50%" outerRadius={90} label={({ type, percent }) => `${type} (${(percent * 100).toFixed(0)}%)`}>
                        {byTypeData.map((_: any, i: number) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(val: number) => `Rs ${val.toLocaleString()}`} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Top Donors */}
          <Card>
            <CardHeader><CardTitle className="text-base">Top Donors</CardTitle></CardHeader>
            <CardContent>
              {topDonors.length === 0 ? (
                <p className="text-muted-foreground text-sm">No donor data available</p>
              ) : (
                <div className="space-y-3">
                  {topDonors.map((d: any, i: number) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-muted-foreground w-6">{i + 1}.</span>
                        <div>
                          <div className="font-medium text-sm">{d.name || d.donorName || 'Anonymous'}</div>
                          <div className="text-xs text-muted-foreground">{d.count || d.donationCount || 0} donations</div>
                        </div>
                      </div>
                      <span className="font-semibold text-sm">Rs {(d.total || d.totalGiven || 0).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* People Tab */}
      {tab === 'people' && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total People', value: membershipSummary.total ?? peopleSummary.totalPeople ?? 0, icon: Users, color: 'bg-blue-500' },
              { label: 'Active Members', value: membershipSummary.members ?? peopleSummary.activeMembers ?? 0, icon: Users, color: 'bg-green-500' },
              { label: 'Visitors', value: membershipSummary.visitors ?? peopleSummary.visitors ?? 0, icon: Users, color: 'bg-yellow-500' },
              { label: 'Inactive', value: membershipSummary.inactive ?? peopleSummary.inactive ?? 0, icon: Users, color: 'bg-gray-500' },
            ].map(({ label, value, icon: Icon, color }) => (
              <Card key={label}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`size-10 rounded-lg ${color} flex items-center justify-center text-white`}>
                      <Icon className="size-5" />
                    </div>
                    <div>
                      <div className="text-xl font-bold">{value}</div>
                      <div className="text-xs text-muted-foreground">{label}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Status Distribution Pie Chart */}
            <Card>
              <CardHeader><CardTitle className="text-base">Status Distribution</CardTitle></CardHeader>
              <CardContent>
                {peopleLoading ? (
                  <div className="h-64 flex items-center justify-center"><Loading /></div>
                ) : peopleError ? (
                  <ErrorState message="Failed to load people report" onRetry={() => refetchPeople()} />
                ) : statusDistribution.length === 0 ? (
                  <EmptyState icon={<Users className="size-8" />} title="No people data yet" description="Status distribution appears here once people are added." />
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie data={statusDistribution} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={90} label={({ status, percent }) => `${status} (${(percent * 100).toFixed(0)}%)`}>
                        {statusDistribution.map((_: any, i: number) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Membership Summary */}
            <Card>
              <CardHeader><CardTitle className="text-base">Membership Summary</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(membershipSummary).filter(([k]) => k !== 'total').map(([key, val]) => (
                    <div key={key} className="flex items-center justify-between">
                      <span className="text-sm capitalize text-muted-foreground">{key.replace(/([A-Z])/g, ' $1')}</span>
                      <span className="font-semibold">{val as number}</span>
                    </div>
                  ))}
                  {Object.keys(membershipSummary).length === 0 && (
                    <p className="text-muted-foreground text-sm">No membership data available</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
