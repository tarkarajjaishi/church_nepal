'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/admin/api'
import { 
  DollarSign, TrendingUp, CreditCard, Wallet, Download, Mail, Eye, 
  RefreshCw, X, Filter
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Loading, EmptyState } from '@/components/LoadingStates'
import { toast } from 'sonner'
import { API_ORIGIN } from '@/lib/apiBase'

const statusColors: Record<string, string> = {
  completed: 'bg-green-100 text-green-700',
  pending: 'bg-yellow-100 text-yellow-700',
  failed: 'bg-red-100 text-red-700',
  refunded: 'bg-gray-100 text-gray-700',
  partially_refunded: 'bg-orange-100 text-orange-700',
}

const gatewayColors: Record<string, string> = {
  stripe: 'bg-purple-100 text-purple-700',
  khalti: 'bg-blue-100 text-blue-700',
  esewa: 'bg-green-100 text-green-700',
  cash: 'bg-teal-100 text-teal-700',
}

function formatNPR(amount: number) {
  return new Intl.NumberFormat('en-NP', { style: 'currency', currency: 'NPR', maximumFractionDigits: 0 }).format(amount)
}

export default function DonationsPage() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [paymentFilter, setPaymentFilter] = useState('all')
  const [fundFilter, setFundFilter] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [minAmount, setMinAmount] = useState('')
  const [maxAmount, setMaxAmount] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [receiptDialog, setReceiptDialog] = useState<{ open: boolean; donation: any }>({ open: false, donation: null })

  const { data: donations = [], isLoading } = useQuery({
    queryKey: ['donations', statusFilter, paymentFilter, fundFilter, dateFrom, dateTo, minAmount, maxAmount, search],
    queryFn: () => {
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.set('status', statusFilter)
      if (paymentFilter !== 'all') params.set('payment_method', paymentFilter)
      if (fundFilter !== 'all') params.set('fund_id', fundFilter)
      if (dateFrom) params.set('start_date', dateFrom)
      if (dateTo) params.set('end_date', dateTo)
      if (minAmount) params.set('min_amount', minAmount)
      if (maxAmount) params.set('max_amount', maxAmount)
      if (search) params.set('donor_email', search)
      return api.get(`/donations?${params.toString()}`).then(r => r.data)
    },
  })

  const { data: stats = {} } = useQuery({
    queryKey: ['donations-stats'],
    queryFn: () => api.get('/donations/stats').then(r => r.data),
  })

  const { data: fundsBreakdown = [] } = useQuery({
    queryKey: ['donations-funds-breakdown'],
    queryFn: () => api.get('/donations/funds-breakdown').then(r => r.data),
  })

  const { data: funds = [] } = useQuery({
    queryKey: ['funds'],
    queryFn: () => api.get('/funds').then(r => r.data),
  })

  const resendMut = useMutation({
    mutationFn: (id: string) => api.post(`/donations/${id}/resend-receipt`, {}).then(r => r.data),
    onSuccess: () => {
      toast.success('Receipt resent successfully')
      setReceiptDialog({ open: false, donation: null })
    },
    onError: () => toast.error('Failed to resend receipt'),
  })

  const totalAmount = donations.reduce((sum: number, d: any) => sum + (d.amount || 0), 0)
  const completedCount = donations.filter((d: any) => d.status === 'completed').length

  const exportCSV = async () => {
    const params = new URLSearchParams()
    if (statusFilter !== 'all') params.set('status', statusFilter)
    if (paymentFilter !== 'all') params.set('payment_method', paymentFilter)
    if (fundFilter !== 'all') params.set('fund_id', fundFilter)
    if (dateFrom) params.set('start_date', dateFrom)
    if (dateTo) params.set('end_date', dateTo)
    if (minAmount) params.set('min_amount', minAmount)
    if (maxAmount) params.set('max_amount', maxAmount)
    if (search) params.set('donor_email', search)

    const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null
    const res = await fetch(`${API_ORIGIN}/api/donations/export-csv?${params.toString()}`, {
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
    a.download = `donations-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('CSV exported successfully')
  }

  const viewReceipt = async (id: string) => {
    try {
      const { data } = await api.get(`/donations/${id}/receipt`)
      setReceiptDialog({ open: true, donation: data })
    } catch {
      toast.error('Failed to load receipt')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#0b3c5d]">Donations</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="size-4 mr-1.5" />
            {showFilters ? 'Hide Filters' : 'Filters'}
          </Button>
          <Button variant="outline" size="sm" onClick={exportCSV}>
            <Download className="size-4 mr-1.5" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Raised', value: formatNPR(stats.total_raised || 0), icon: DollarSign, color: 'bg-green-500' },
          { label: 'Total Donations', value: stats.total_donations || 0, icon: TrendingUp, color: 'bg-blue-500' },
          { label: 'eSewa Total', value: formatNPR(stats.esewa_total || 0), icon: CreditCard, color: 'bg-purple-500' },
          { label: 'Khalti Total', value: formatNPR(stats.khalti_total || 0), icon: CreditCard, color: 'bg-red-500' },
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

      {/* Filter Bar */}
      {showFilters && (
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <div className="space-y-1">
                <Label className="text-xs">Donor Email</Label>
                <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search email..." />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Date From</Label>
                <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Date To</Label>
                <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Min Amount (Rs)</Label>
                <Input type="number" value={minAmount} onChange={e => setMinAmount(e.target.value)} placeholder="0" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Max Amount (Rs)</Label>
                <Input type="number" value={maxAmount} onChange={e => setMaxAmount(e.target.value)} placeholder="0" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="refunded">Refunded</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Payment Method</Label>
                <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Methods</SelectItem>
                    <SelectItem value="esewa">eSewa</SelectItem>
                    <SelectItem value="khalti">Khalti</SelectItem>
                    <SelectItem value="stripe">Stripe</SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Fund</Label>
                <Select value={fundFilter} onValueChange={setFundFilter}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Funds</SelectItem>
                    {funds.map((f: any) => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {(search || statusFilter !== 'all' || paymentFilter !== 'all' || fundFilter !== 'all' || dateFrom || dateTo || minAmount || maxAmount) && (
              <div className="mt-3 flex justify-end">
                <Button variant="ghost" size="sm" onClick={() => {
                  setSearch(''); setStatusFilter('all'); setPaymentFilter('all')
                  setFundFilter('all'); setDateFrom(''); setDateTo('')
                  setMinAmount(''); setMaxAmount('')
                }}>
                  <X className="size-3.5 mr-1" /> Clear Filters
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Funds Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Wallet className="size-4" /> Funds Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {fundsBreakdown.map((fund: any) => (
              <div key={fund.id} className="p-3 rounded-lg border bg-muted/30">
                <div className="text-sm font-medium">{fund.name}</div>
                <div className="text-xs text-muted-foreground capitalize">{fund.fund_type}</div>
                <div className="text-lg font-bold mt-1">{formatNPR(fund.total)}</div>
                <div className="text-xs text-muted-foreground">{fund.count} donations</div>
              </div>
            ))}
            {fundsBreakdown.length === 0 && (
              <div className="col-span-full text-sm text-muted-foreground">No fund data available</div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Donations Table */}
      <Card>
        <CardContent>
          {isLoading ? (
            <Loading />
          ) : donations.length === 0 ? (
            <EmptyState icon={<DollarSign className="size-10" />} title="No donations found" description="Donations will appear here once recorded." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b">
                  <tr className="text-left text-muted-foreground">
                    <th className="p-2">Donor</th>
                    <th className="p-2">Email</th>
                    <th className="p-2 text-right">Amount</th>
                    <th className="p-2">Method</th>
                    <th className="p-2">Status</th>
                    <th className="p-2">Refund</th>
                    <th className="p-2">Gateway / TXN</th>
                    <th className="p-2">Date</th>
                    <th className="p-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {donations.map((d: any) => (
                    <tr key={d.id} className="border-b last:border-0 hover:bg-muted/50">
                      <td className="p-2 font-medium">{d.donorName || d.donorEmail || 'Anonymous'}</td>
                      <td className="p-2 text-muted-foreground text-xs">{d.donorEmail}</td>
                      <td className="p-2 text-right font-semibold">{formatNPR(d.amount)}</td>
                      <td className="p-2 text-muted-foreground capitalize">{d.paymentMethod}</td>
                      <td className="p-2">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[d.status] || 'bg-gray-100 text-gray-700'}`}>
                          {d.status}
                        </span>
                      </td>
                      <td className="p-2 text-xs">
                        {d.refundStatus !== 'none' && (
                          <span className={d.refundStatus === 'refunded' ? 'text-red-600 font-medium' : 'text-orange-600'}>
                            {d.refundStatus} {d.refundAmount > 0 ? `(Rs ${d.refundAmount.toLocaleString()})` : ''}
                          </span>
                        )}
                      </td>
                      <td className="p-2 text-xs text-muted-foreground">
                        {d.transactionId ? d.transactionId.slice(0, 12) + (d.transactionId.length > 12 ? '...' : '') : 'N/A'}
                      </td>
                      <td className="p-2 text-xs text-muted-foreground">{new Date(d.createdAt).toLocaleDateString()}</td>
                      <td className="p-2 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button size="sm" variant="ghost" onClick={() => viewReceipt(d.id)} title="View receipt">
                            <Eye className="size-3.5" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => resendMut.mutate(d.id)} title="Resend receipt">
                            <Mail className="size-3.5" />
                          </Button>
                          {d.status === 'completed' && d.refundStatus !== 'refunded' && (
                            <Button size="sm" variant="ghost" onClick={() => {
                              if (confirm(`Refund donation ${d.id}?`)) {
                                api.post(`/donations/${d.id}/refund`, { amount: d.amount, reason: 'Admin refund' })
                                  .then(() => { toast.success('Refund processed'); qc.invalidateQueries({ queryKey: ['donations'] }) })
                                  .catch(() => toast.error('Refund failed'))
                              }
                            }} title="Refund">
                              <RefreshCw className="size-3.5" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Receipt Dialog */}
      <Dialog open={receiptDialog.open} onOpenChange={(open) => setReceiptDialog({ open, donation: receiptDialog.donation })}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Donation Receipt</DialogTitle>
            <DialogDescription>Receipt details for this donation.</DialogDescription>
          </DialogHeader>
          {receiptDialog.donation && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div><span className="text-muted-foreground">Donor:</span> {receiptDialog.donation.donorName || 'Anonymous'}</div>
                <div><span className="text-muted-foreground">Email:</span> {receiptDialog.donation.donorEmail}</div>
                <div><span className="text-muted-foreground">Amount:</span> {formatNPR(receiptDialog.donation.amount)}</div>
                <div><span className="text-muted-foreground">Method:</span> {receiptDialog.donation.paymentMethod}</div>
                <div><span className="text-muted-foreground">Status:</span> {receiptDialog.donation.status}</div>
                <div><span className="text-muted-foreground">Transaction:</span> {receiptDialog.donation.transactionId || '-'}</div>
                <div><span className="text-muted-foreground">Date:</span> {new Date(receiptDialog.donation.createdAt).toLocaleString()}</div>
                <div><span className="text-muted-foreground">Church:</span> {receiptDialog.donation.churchName}</div>
              </div>
              {receiptDialog.donation.churchAddress && (
                <div className="text-xs text-muted-foreground">{receiptDialog.donation.churchAddress}</div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setReceiptDialog({ open: false, donation: null })}>Close</Button>
            <Button onClick={() => receiptDialog.donation && resendMut.mutate(receiptDialog.donation.donationId)} disabled={resendMut.isPending}>
              <Mail className="size-4 mr-1.5" />
              {resendMut.isPending ? 'Sending...' : 'Resend Receipt'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
