'use client'

import { ReactNode, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Providers } from '@/lib/providers'
import { AuthProvider, useAuth } from '@/lib/auth'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { Layout } from '@/components/admin/Layout'
import AdminNav from '@/components/admin/AdminNav'
import { ThemeCustomizer } from '@/components/theme/ThemeCustomizer'
import { Toaster } from '@/components/ui/sonner'

/**
 * Gate every admin page behind a login. While the session is being checked we
 * show a spinner; if there is no signed-in user we redirect to /admin/login.
 * This is what makes a bare /admin (which redirects to /admin/dashboard) land
 * on the login screen for signed-out visitors.
 */
function AuthGuard({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/admin/login')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!user) return null

  return <>{children}</>
}

/**
 * Admin Layout
 *
 * Wraps all admin pages with:
 * - Query client provider (react-query)
 * - Authentication provider (manages user session)
 * - Error boundary (catches component errors)
 * - Auth guard + left sidebar (on all pages except login)
 * - Toast notifications and the admin-only Theme Customizer
 */
export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const isLogin = pathname === '/admin/login'

  return (
    <Providers>
      <ErrorBoundary>
        <AuthProvider>
          {isLogin ? (
            <div className="min-h-screen bg-background">
              <AdminNav />
              <main className="container mx-auto py-8 px-4">
                {children}
              </main>
            </div>
          ) : (
            <AuthGuard>
              <Layout>{children}</Layout>
            </AuthGuard>
          )}
          <Toaster />
          {!isLogin && <ThemeCustomizer />}
        </AuthProvider>
      </ErrorBoundary>
    </Providers>
  )
}
