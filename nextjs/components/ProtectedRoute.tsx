'use client'

import { useAuth } from '@/lib/auth'
import { useRouter } from 'next/navigation'
import { useEffect, ReactNode } from 'react'
import { Lock } from 'lucide-react'
import { LoadingSpinner } from '@/components/LoadingStates'

/**
 * Gate an admin page behind a signed-in user of at least a given role.
 *
 * Roles rank; they are not a set of equal labels. Comparing them for equality
 * meant `requiredRole="editor"` refused an **administrator** — the account with
 * the most access was the one locked out of Blog, Team, Services and Portfolio,
 * and it was bounced to the dashboard with no explanation, so the links simply
 * looked broken.
 *
 * This only decides what is *shown*. The server checks permissions on every
 * request and is the only thing that actually protects anything.
 */
const RANK: Record<string, number> = { viewer: 1, editor: 2, admin: 3 }

function outranks(held: string | undefined, needed: string): boolean {
  return (RANK[held ?? ''] ?? 0) >= (RANK[needed] ?? Number.MAX_SAFE_INTEGER)
}

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
  }, [user, loading, router])

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

  if (requiredRole && !outranks(user.role, requiredRole)) {
    // Said, not silently redirected. A bounce to the dashboard is
    // indistinguishable from a broken link.
    return (
      <div className="text-center py-20 px-4">
        <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-muted">
          <Lock className="size-6 text-muted-foreground" aria-hidden />
        </div>
        <p className="font-medium text-foreground">You do not have access to this</p>
        <p className="text-sm text-muted-foreground mt-1">
          This page needs the {requiredRole} role. Ask an administrator for access.
        </p>
      </div>
    )
  }

  return <>{children}</>
}
