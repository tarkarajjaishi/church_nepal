'use client'

import Link from 'next/link'
import { Construction } from 'lucide-react'
import { CARD, PageHeader, btn } from '@/components/offerings/ui'

/**
 * Placeholder for module pages that are in the plan but not implemented.
 *
 * Deliberately explicit rather than a fake screen with placeholder numbers:
 * a finance tool showing invented figures is worse than one that admits a page
 * is not ready, and a reviewer needs to be able to tell the difference at a
 * glance.
 */
export function NotBuiltYet({
  title,
  subtitle,
  planned,
  dependsOn,
}: {
  title: string
  subtitle?: string
  planned: string[]
  dependsOn?: string
}) {
  return (
    <>
      <PageHeader title={title} subtitle={subtitle} />
      <div className={`${CARD} p-6 sm:p-8`}>
        <div className="flex items-start gap-4">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-amber-100">
            <Construction className="size-5 text-amber-800" aria-hidden />
          </div>
          <div className="min-w-0">
            <h2 className="font-semibold text-foreground">Not built yet</h2>
            <p className="text-sm text-muted-foreground mt-1 max-w-prose">
              This page is part of the Offering Management plan but has no
              implementation behind it. It is listed in the navigation so the
              module&rsquo;s full shape is visible, and it shows nothing rather
              than placeholder figures.
            </p>

            <h3 className="text-sm font-medium text-foreground mt-5 mb-2">Planned for this page</h3>
            <ul className="space-y-1.5">
              {planned.map((p) => (
                <li key={p} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="mt-1.5 size-1.5 rounded-full bg-muted-foreground/50 shrink-0" aria-hidden />
                  {p}
                </li>
              ))}
            </ul>

            {dependsOn && (
              <p className="mt-4 text-xs text-muted-foreground">
                <span className="font-medium text-foreground">Depends on:</span> {dependsOn}
              </p>
            )}

            <div className="mt-6 flex flex-wrap gap-2">
              <Link href="/admin/offering-management" className={btn.primary}>
                Back to dashboard
              </Link>
              <Link href="/admin/offering-management/offerings" className={btn.secondary}>
                View offerings
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
