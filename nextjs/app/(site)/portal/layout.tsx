'use client'

import { ReactNode, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Providers } from '@/lib/providers'
import { PortalAuthProvider, usePortalAuth } from '@/lib/portal/auth'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { PortalNav } from '@/components/portal/PortalNav'
import { Toaster } from '@/components/ui/sonner'

function PortalAuthGuard({ children }: { children: ReactNode }) {
  const { user, loading } = usePortalAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/portal/login')
    } else if (!loading && user && user.role === 'admin') {
      router.replace('/admin/dashboard')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!user || user.role === 'admin') return null

  return <>{children}</>
}

export default function PortalLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const isLogin = pathname === '/portal/login' || pathname === '/portal/verify-magic'

  return (
    <Providers>
      <ErrorBoundary>
        <PortalAuthProvider>
          {isLogin ? (
            <div className="min-h-screen bg-background">
              <main className="container mx-auto py-8 px-4">
                {children}
              </main>
            </div>
          ) : (
            <PortalAuthGuard>
              <PortalNav />
              <main className="container mx-auto py-8 px-4">
                {children}
              </main>
            </PortalAuthGuard>
          )}
          <Toaster />
        </PortalAuthProvider>
      </ErrorBoundary>
    </Providers>
  )
}
