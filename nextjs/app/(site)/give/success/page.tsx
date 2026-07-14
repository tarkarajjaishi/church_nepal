'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export default function GiveSuccess() {
  const searchParams = useSearchParams()
  const donationId = searchParams.get('donation_id')

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <Card className="p-8 max-w-md w-full text-center">
        <div className="mx-auto size-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
          <CheckCircle className="size-8 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold text-church-blue mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
          Thank You for Your Generosity!
        </h1>
        <p className="text-muted-foreground mb-6">
          Your donation has been received. May God bless you abundantly for your giving.
        </p>
        {donationId && (
          <div className="bg-gray-50 rounded-lg p-3 mb-6 text-sm">
            <span className="text-gray-500">Donation ID:</span>{' '}
            <span className="font-mono text-gray-700">{donationId}</span>
          </div>
        )}
        <div className="flex gap-3 justify-center">
          <Button asChild className="bg-church-blue hover:bg-church-blue/90">
            <Link href="/">Back to Home <ArrowRight className="size-4" /></Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/give">Give Again</Link>
          </Button>
        </div>
      </Card>
    </div>
  )
}
