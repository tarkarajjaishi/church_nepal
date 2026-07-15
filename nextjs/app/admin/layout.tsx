'use client'

import { ReactNode } from 'react'
import { Providers } from '@/lib/providers'
import { AuthProvider } from '@/lib/auth'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import AdminNav from '@/components/admin/AdminNav'
import { Toaster } from 'sonner'

/**
 * Admin Layout
 *
 * Wraps all admin pages with:
 * - Query client provider (react-query)
 * - Authentication provider (manages user session)
 * - Error boundary (catches component errors)
 * - Global navigation
 * - Toast notifications
 */
export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <Providers>
      <ErrorBoundary>
        <AuthProvider>
          <div className="min-h-screen bg-gray-50">
            <AdminNav />
            <main className="container mx-auto py-8 px-4">
              {children}
            </main>
            <Toaster />
          </div>
        </AuthProvider>
      </ErrorBoundary>
    </Providers>
  )
}
