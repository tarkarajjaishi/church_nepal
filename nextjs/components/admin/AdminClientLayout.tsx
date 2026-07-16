'use client'

import { AuthProvider } from '@/lib/auth'
import { Providers } from '@/lib/providers'
import { Layout as AdminLayoutComponent } from '@/components/admin/Layout'
import { ThemeCustomizer } from '@/components/theme/ThemeCustomizer'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { useEffect } from 'react'

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/admin/login')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="size-8 border-4 border-[#0b3c5d] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  return <>{children}</>
}

export function AdminClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isLoginPage = pathname === '/admin/login'

  return (
    <Providers>
      <AuthProvider>
        {isLoginPage ? (
          children
        ) : (
          <AuthGuard>
            <AdminLayoutComponent>{children}</AdminLayoutComponent>
            <ThemeCustomizer />
          </AuthGuard>
        )}
      </AuthProvider>
    </Providers>
  )
}
