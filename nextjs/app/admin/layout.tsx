'use client'

import { Providers } from '@/lib/providers'
import { AuthProvider, useAuth } from '@/lib/auth'
import { Layout } from '@/components/admin/Layout'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()
  
  useEffect(() => {
    if (!loading && !user) {
      router.push('/admin/login')
    }
  }, [user, loading, router])
  
  if (loading) return <div className="flex items-center justify-center h-screen">Loading...</div>
  if (!user) return null
  return <>{children}</>
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      <AuthProvider>
        <ProtectedRoute>
          <Layout>{children}</Layout>
        </ProtectedRoute>
      </AuthProvider>
    </Providers>
  )
}
