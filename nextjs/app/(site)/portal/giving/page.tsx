'use client'

import { useState, useEffect } from 'react'
import { Heart, Download, Calendar, DollarSign } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import api from '@/lib/portal/api'

interface Donation {
  id: string
  amount: number
  paymentMethod: string
  status: string
  createdAt: string
  transactionId?: string
  notes?: string
}

interface DonationSummary {
  totalAmount: number
  donationCount: number
  averageDonation: number
}

export default function PortalGivingPage() {
  const [donations, setDonations] = useState<Donation[]>([])
  const [loading, setLoading] = useState(true)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const [summary, setSummary] = useState<DonationSummary>({
    totalAmount: 0,
    donationCount: 0,
    averageDonation: 0,
  })

  useEffect(() => {
    fetchDonations()
  }, [])

  useEffect(() => {
    if (donations.length > 0) {
      const total = donations.reduce((sum, d) => sum + d.amount, 0)
      setSummary({
        totalAmount: total,
        donationCount: donations.length,
        averageDonation: Math.round(total / donations.length),
      })
    }
  }, [donations])

  const fetchDonations = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (startDate) params.append('start_date', startDate)
      if (endDate) params.append('end_date', endDate)

      const res = await api.get(`/portal/donations?${params.toString()}`)
      setDonations(res.data)
    } catch (err) {
      console.error('Failed to load donations', err)
    } finally {
      setLoading(false)
    }
  }

  const exportStatement = () => {
    if (donations.length === 0) {
      toast.error('No donations to export')
      return
    }

    // Header for the CSV - including donor info and donation details
    let csv = 'Donor Name,Donor Email,Donor Phone,Date,Amount,Payment Method,Transaction ID,Fund,Notes\n'
    
    donations.forEach((d) => {
      // Helper function to escape CSV fields
      const escapeField = (field: string | number | null | undefined): string => {
        if (field === null || field === undefined) return ''
        const str = String(field)
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`
        }
        return str
      }
      
      const donorName = escapeField(d.donorName || '')
      const donorEmail = escapeField(d.donorEmail || '')
      const donorPhone = escapeField(d.donorPhone || '')
      const date = d.createdAt // Assuming this is already a string date
      const amount = d.amount
      const paymentMethod = escapeField(d.paymentMethod || '')
      const transactionId = escapeField(d.transactionId || '')
      const fund = escapeField(d.fundId || '')
      const notes = escapeField((d.notes || '').replace(/,/g, ';')) // Replace commas in notes to avoid CSV issues
      
      csv += `${donorName},${donorEmail},${donorPhone},${date},${amount},${paymentMethod},${transactionId},${fund},${notes}\n`
    })

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    // Include date range in filename if available
    const dateRange = 
      (startDate ? `_${startDate}` : '') + 
      (endDate ? `_to_${endDate}` : '')
    a.download = `donation-statement${dateRange}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-church-blue">Giving History</h1>
        <Button
          onClick={exportStatement}
          disabled={donations.length === 0}
          variant="outline"
          className="flex items-center gap-2"
        >
          <Download className="size-4" />
          Export Statement
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-full bg-green-100 flex items-center justify-center">
                <DollarSign className="size-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Given</p>
                <p className="text-xl font-bold text-church-blue">Rs {summary.totalAmount.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Heart className="size-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Donations</p>
                <p className="text-xl font-bold text-church-blue">{summary.donationCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-full bg-purple-100 flex items-center justify-center">
                <Calendar className="size-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Average</p>
                <p className="text-xl font-bold text-church-blue">Rs {summary.averageDonation.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filter by Date</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div>
              <Label htmlFor="start">From</Label>
              <Input
                id="start"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-40"
              />
            </div>
            <div>
              <Label htmlFor="end">To</Label>
              <Input
                id="end"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-40"
              />
            </div>
            <div className="flex items-end">
              <Button onClick={fetchDonations} variant="secondary">
                Apply
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {donations.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Heart className="size-12 text-muted-foreground/50 mx-auto mb-4" />
            <p className="text-muted-foreground">No donations found for the selected period.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {donations.map((donation) => (
            <Card key={donation.id} className="border-border/60">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-church-blue">
                      Rs {donation.amount.toLocaleString()}
                    </p>
                    <p className="text-sm text-muted-foreground capitalize">
                      {donation.paymentMethod} · {donation.status}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(donation.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                  <span
                    className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${
                      donation.status === 'completed'
                        ? 'bg-green-100 text-green-700'
                        : donation.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {donation.status}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
