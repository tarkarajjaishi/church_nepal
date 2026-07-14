'use client'

import { usePathname } from 'next/navigation'
import { AuthProvider, useAuth } from '@/lib/auth'
import { Providers } from '@/lib/providers'
import { Layout as AdminLayoutComponent } from '@/components/admin/Layout'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  // Skip protection for login page
  if (pathname === '/admin/login') {
    return <>{children}</>
  }

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
  const pathname = usePathname()
  const isLoginPage = pathname === '/admin/login'

  return (
    <Providers>
      <AuthProvider>
        <ProtectedRoute>
          {isLoginPage ? (
            children
          ) : (
            <AdminLayoutComponent>{children}</AdminLayoutComponent>
          )}
        </ProtectedRoute>
      </AuthProvider>
    </Providers>
  )
}
