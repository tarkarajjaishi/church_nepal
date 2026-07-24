'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Church, Loader2, AlertCircle } from 'lucide-react'

export default function VerifyMagicPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)
  const [verifying, setVerifying] = useState(true)

  useEffect(() => {
    const verifyToken = async () => {
      const token = searchParams.get('token')
      if (!token) {
        setError('Invalid or expired magic link')
        setVerifying(false)
        return
      }

      try {
        const res = await fetch('/api/portal/magic-login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        })

        if (res.ok) {
          const data = await res.json()
          if (data.token) {
            localStorage.setItem('admin_token', data.token)
            router.push('/portal/profile')
          } else {
            setError('Failed to sign in')
          }
        } else {
          const err = await res.json()
          setError(err.error || 'Invalid or expired magic link')
        }
      } catch {
        setError('Network error. Please try again.')
      } finally {
        setVerifying(false)
      }
    }

    verifyToken()
  }, [router, searchParams])

  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-secondary to-muted px-4">
        <div className="text-center">
          <Loader2 className="size-12 text-church-blue animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Verifying your sign-in link...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-secondary to-muted px-4">
      <div className="w-full max-w-sm">
        <div className="bg-card rounded-2xl shadow-xl overflow-hidden border border-border p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-red-100 mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-church-blue mb-2">Sign In Failed</h1>
          <p className="text-muted-foreground mb-6">{error}</p>
          <button
            onClick={() => router.push('/portal/login')}
            className="px-6 py-2 bg-church-blue text-white rounded-lg hover:bg-church-blue/90 transition-colors"
          >
            Back to Login
          </button>
        </div>
      </div>
    </div>
  )
}
