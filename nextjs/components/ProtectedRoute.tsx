'use client'

import { useAuth } from '@/lib/auth'
import { useRouter } from 'next/navigation'
import { useEffect, ReactNode } from 'react'
import { LoadingSpinner } from '@/components/LoadingStates'

/**
 * ProtectedRoute - Wrapper for admin pages requiring authentication
 *
 * Features:
 * - Redirects unauthenticated users to login
 * - Checks user role/permissions
 * - Shows loading state while auth is loading
 * - Prevents flash of unprotected content
 */
export function ProtectedRoute({
  children,
  requiredRole,
}: {
  children: ReactNode
  requiredRole?: string
}) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/admin/login')
    }

    if (user && requiredRole && user.role !== requiredRole) {
      router.push('/admin/dashboard')
    }
  }, [user, loading, requiredRole, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner message="Loading..." />
      </div>
    )
  }

  if (!user) {
    return null
  }

  if (requiredRole && user.role !== requiredRole) {
    return null
  }

  return <>{children}</>
}
