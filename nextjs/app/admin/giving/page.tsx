'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/admin/api'
import { DollarSign, Users, TrendingUp, Calendar, ChevronDown, ChevronUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'

const typeColors: Record<string, string> = {
  tithe: 'bg-green-100 text-green-800',
  offering: 'bg-blue-100 text-blue-800',
  donation: 'bg-purple-100 text-purple-800',
  building: 'bg-orange-100 text-orange-800',
  missions: 'bg-yellow-100 text-yellow-800',
  general: 'bg-gray-100 text-gray-800',
}

export default function GivingDashboard() {
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [expandedDonor, setExpandedDonor] = useState<string | null>(null)

  const dateParams = new URLSearchParams()
  if (fromDate) dateParams.set('from', fromDate)
  if (toDate) dateParams.set('to', toDate)
  const dateQs = dateParams.toString()

  const { data: stats = {}, isLoading: statsLoading } = useQuery({
    queryKey: ['donations-stats', fromDate, toDate],
    queryFn: () => api.get(`/donations/stats${dateQs ? '?' + dateQs : ''}`).then(r => r.data),
  })

  const { data: byDonor = [], isLoading: donorLoading } = useQuery({
    queryKey: ['donations-by-donor', fromDate, toDate],
    queryFn: () => api.get(`/donations/by-donor${dateQs ? '?' + dateQs : ''}`).then(r => r.data),
  })

  const { data: donorHistory = [] } = useQuery({
    queryKey: ['donations-by-donor-history', expandedDonor, fromDate, toDate],
    queryFn: () => {
      const p = new URLSearchParams(dateParams.toString())
      if (expandedDonor) p.set('donor_email', expandedDonor)
      return api.get(`/donations/by-donor?${p.toString()}`).then(r => r.data)
    },
    enabled: !!expandedDonor,
  })

  const { data: allDonations = [] } = useQuery({
    queryKey: ['donations', fromDate, toDate],
    queryFn: () => api.get(`/donations${dateQs ? '?' + dateQs : ''}`).then(r => r.data),
  })

  const clearDates = () => { setFromDate(''); setToDate('') }

  const selectedDonorHistory = expandedDonor
    ? allDonations.filter((d: any) => d.donorEmail === expandedDonor)
    : []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#0b3c5d]">Giving Dashboard</h1>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { label: 'Total Raised', value: `Rs ${(stats.totalRaised || 0).toLocaleString()}`, icon: DollarSign, color: 'bg-green-500' },
          { label: 'Total Donors', value: stats.totalDonors || byDonor.length || 0, icon: Users, color: 'bg-blue-500' },
          { label: 'Average Gift', value: `Rs ${(stats.averageGift || 0).toLocaleString()}`, icon: TrendingUp, color: 'bg-purple-500' },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`size-10 rounded-lg ${color} flex items-center justify-center text-white`}>
                  <Icon className="size-5" />
                </div>
                <div>
                  <div className="text-xl font-bold text-gray-900">{value}</div>
                  <div className="text-xs text-gray-500">{label}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Date Range Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Calendar className="size-4 text-muted-foreground" />
              <Label className="text-sm">Date Range:</Label>
            </div>
            <div className="flex items-center gap-2">
              <Input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="w-40" />
              <span className="text-muted-foreground">to</span>
              <Input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="w-40" />
            </div>
            {(fromDate || toDate) && (
              <Button variant="outline" size="sm" onClick={clearDates}>Clear</Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Donors Table */}
      <Card>
        <CardHeader>
          <CardTitle>Donor Summary</CardTitle>
        </CardHeader>
        <CardContent>
          {donorLoading ? (
            <div className="p-8 text-center text-muted-foreground">Loading...</div>
          ) : byDonor.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">No donor data found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="p-2">Donor</th>
                    <th className="p-2">Email</th>
                    <th className="p-2 text-right">Total Given</th>
                    <th className="p-2 text-right">Donations</th>
                    <th className="p-2 text-right">Avg Gift</th>
                    <th className="p-2 text-right"></th>
                  </tr>
                </thead>
                <tbody>
                  {byDonor.map((d: any) => {
                    const isExpanded = expandedDonor === d.donorEmail
                    return (
                      <tr key={d.donorEmail || 'anonymous'} className="border-b hover:bg-muted/50">
                        <td className="p-2 font-medium">{d.donorName || 'Anonymous'}</td>
                        <td className="p-2 text-muted-foreground">{d.donorEmail || '-'}</td>
                        <td className="p-2 text-right font-semibold">Rs {(d.totalGiven || 0).toLocaleString()}</td>
                        <td className="p-2 text-right">{d.donationCount || 0}</td>
                        <td className="p-2 text-right text-muted-foreground">Rs {(d.averageGift || 0).toLocaleString()}</td>
                        <td className="p-2 text-right">
                          <Button variant="ghost" size="sm" onClick={() => setExpandedDonor(isExpanded ? null : d.donorEmail)}>
                            {isExpanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                          </Button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Expanded Donor History */}
      {expandedDonor && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Donation History - {expandedDonor}</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedDonorHistory.length === 0 ? (
              <p className="text-muted-foreground text-sm">No individual donation records found for this donor.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="p-2">Date</th>
                      <th className="p-2">Amount</th>
                      <th className="p-2">Method</th>
                      <th className="p-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedDonorHistory.map((d: any) => (
                      <tr key={d.id} className="border-b last:border-0">
                        <td className="p-2">{new Date(d.createdAt).toLocaleDateString()}</td>
                        <td className="p-2 font-medium">Rs {d.amount.toLocaleString()}</td>
                        <td className="p-2 text-muted-foreground capitalize">{d.paymentMethod}</td>
                        <td className="p-2">
                          <Badge variant="secondary" className={`text-xs ${d.status === 'completed' ? 'bg-green-100 text-green-800' : d.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}>
                            {d.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
