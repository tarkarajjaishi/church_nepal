'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, ArrowRight, Mail, Loader2 } from "lucide-react"
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useSettings } from '@/lib/hooks/settings'

interface ReceiptData {
  donation_id: string
  amount: number
  payment_method: string
  status: string
  donor_name: string
  donor_email: string
  donor_phone: string
  created_at: string
  transaction_id: string
  notes: string
  church_name: string
  church_email: string
  church_address: string
  church_phone: string
}

function GiveSuccessContent() {
  const searchParams = useSearchParams()
  const donationId = searchParams.get('donation_id')
  const { data: settings = [] } = useSettings()
  const [loading, setLoading] = useState(true)
  const [receipt, setReceipt] = useState<ReceiptData | null>(null)
  const [error, setError] = useState<string | null>(null)

  const settingMap = Object.fromEntries(settings.map((s: any) => [s.key, s.value]))

  useEffect(() => {
    if (!donationId) {
      setError('Missing donation ID.')
      setLoading(false)
      return
    }

    let attempts = 0
    const maxAttempts = 30
    const interval = setInterval(async () => {
      attempts++
      try {
        const res = await fetch(`/api/give?donation_id=${donationId}`)
        if (res.ok) {
          const data = await res.json()
          if (data.status === 'completed' || data.status === 'failed') {
            const receiptRes = await fetch(`/api/give?receipt=${donationId}`)
            if (receiptRes.ok) {
              const receiptData = await receiptRes.json()
              setReceipt(receiptData)
            } else {
              setReceipt(data as ReceiptData)
            }
            setLoading(false)
            clearInterval(interval)
          } else if (attempts >= maxAttempts) {
            const receiptRes = await fetch(`/api/give?receipt=${donationId}`)
            if (receiptRes.ok) {
              const receiptData = await receiptRes.json()
              setReceipt(receiptData)
            } else {
              setReceipt(data as ReceiptData)
            }
            setLoading(false)
            clearInterval(interval)
          }
        } else {
          if (attempts >= maxAttempts) {
            setError('Could not verify payment status.')
            setLoading(false)
            clearInterval(interval)
          }
        }
      } catch {
        if (attempts >= maxAttempts) {
          setError('Network error while verifying payment.')
          setLoading(false)
          clearInterval(interval)
        }
      }
    }, 2000)

    return () => clearInterval(interval)
  }, [donationId])

  const emailReceipt = () => {
    if (!receipt) return
    const subject = `Receipt for your donation to ${receipt.church_name || 'Grace Church'}`
    const body = [
      `Donation ID: ${receipt.donation_id}`,
      `Amount: Rs ${receipt.amount}`,
      `Date: ${new Date(receipt.created_at).toLocaleString()}`,
      `Payment Method: ${receipt.payment_method}`,
      `Status: ${receipt.status}`,
      `Transaction ID: ${receipt.transaction_id || 'N/A'}`,
      `Donor: ${receipt.donor_name || 'Anonymous'}`,
      '',
      `Thank you for your generous gift to ${receipt.church_name || 'Grace Church'}.`,
      '',
      `Church Address: ${receipt.church_address || ''}`,
      `Church Phone: ${receipt.church_phone || ''}`,
      `Church Email: ${receipt.church_email || ''}`,
    ].join('\n')
    window.location.href = `mailto:${receipt.donor_email || receipt.church_email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <Card className="p-8 max-w-md w-full text-center">
          <Loader2 className="size-10 text-church-blue mx-auto mb-4 animate-spin" />
          <h1 className="text-xl font-bold text-church-blue" style={{ fontFamily: 'var(--font-heading)' }}>
            Verifying your payment...
          </h1>
          <p className="text-muted-foreground mt-2">Please wait while we confirm your donation.</p>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <Card className="p-8 max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-church-blue mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
            Something went wrong
          </h1>
          <p className="text-muted-foreground mb-6">{error}</p>
          <div className="flex gap-3 justify-center">
            <Button asChild className="bg-church-blue hover:bg-church-blue/90">
              <Link href="/">Back to Home <ArrowRight className="size-4" /></Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/give">Try Again</Link>
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  if (!receipt) {
    return null
  }

  const isCompleted = receipt.status === 'completed'

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <Card className="p-8 max-w-lg w-full">
        <div className="text-center mb-6">
          <div className={`mx-auto size-16 rounded-full flex items-center justify-center mb-4 ${isCompleted ? 'bg-green-100' : 'bg-yellow-100'}`}>
            <CheckCircle className={`size-8 ${isCompleted ? 'text-green-600' : 'text-yellow-600'}`} />
          </div>
          <h1 className="text-2xl font-bold text-church-blue" style={{ fontFamily: 'var(--font-heading)' }}>
            {isCompleted ? 'Thank You for Your Generosity!' : 'Payment Pending'}
          </h1>
          <p className="text-muted-foreground mt-2">
            {isCompleted
              ? 'Your donation has been received. May God bless you abundantly for your giving.'
              : 'We have recorded your donation. Payment confirmation may take a few minutes.'}
          </p>
        </div>

        <div className="border rounded-lg p-5 space-y-3 bg-gray-50">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Donation ID</span>
            <span className="font-mono text-gray-700">{receipt.donation_id}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Amount</span>
            <span className="font-semibold text-church-blue">Rs {receipt.amount.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Payment Method</span>
            <span className="text-gray-700 capitalize">{receipt.payment_method}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Date</span>
            <span className="text-gray-700">{new Date(receipt.created_at).toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Transaction ID</span>
            <span className="font-mono text-gray-700">{receipt.transaction_id || 'Pending'}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Donor</span>
            <span className="text-gray-700">{receipt.donor_name || 'Anonymous'}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Status</span>
            <span className={`font-medium ${isCompleted ? 'text-green-600' : 'text-yellow-600'}`}>{receipt.status}</span>
          </div>
          {receipt.notes && (
            <div className="text-sm text-gray-500 pt-2 border-t">
              <span className="block mb-1">Notes</span>
              <span className="text-gray-700">{receipt.notes}</span>
            </div>
          )}
        </div>

        <div className="mt-6 flex gap-3 justify-center">
          {isCompleted && (
            <Button onClick={emailReceipt} className="bg-church-blue hover:bg-church-blue/90">
              <Mail className="size-4 mr-2" /> Email Receipt
            </Button>
          )}
          <Button asChild variant="outline">
            <Link href="/">Back to Home</Link>
          </Button>
          <Button asChild className="bg-gold text-church-blue hover:bg-gold/90">
            <Link href="/give">Give Again <ArrowRight className="size-4 ml-1" /></Link>
          </Button>
        </div>

        <p className="mt-4 text-xs text-center text-muted-foreground">
          {receipt.church_name || 'Grace Church'} · {receipt.church_email || ''} · {receipt.church_phone || ''}
        </p>
      </Card>
    </div>
  )
}

export default function GiveSuccess() {
  return (
    <Suspense fallback={<div className="min-h-[60vh] flex items-center justify-center"><div className="animate-spin size-8 border-4 border-[#0b3c5d] border-t-transparent rounded-full" /></div>}>
      <GiveSuccessContent />
    </Suspense>
  )
}
