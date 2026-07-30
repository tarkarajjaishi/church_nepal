'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { BarChart3, ArrowRight, Lock, FileDown, CalendarRange } from 'lucide-react'
import api from '@/lib/api'
import { CARD, PageHeader, ErrorState, TableSkeleton, Chip } from '@/components/offerings/ui'

/**
 * Financial reports.
 *
 * These are the giving reports from the reporting module, not a second set
 * built here. Two report engines over the same offerings would eventually
 * disagree, and then nobody could say which figure was right — so this page
 * is a way in, and the reports themselves live where every other report does:
 * one period picker, one comparison window, one CSV and PDF writer.
 */

interface ReportInfo {
  key: string
  name: string
  description: string
  group: string
  permission: string
  available: boolean
}

export default function FinancialReportsPage() {
  const { data, isLoading, isError, error, failureReason, refetch, isFetching } = useQuery({
    queryKey: ['reports', 'catalogue'],
    queryFn: () => api.get<ReportInfo[]>('/reports').then((r) => r.data),
  })
  const failure = (error ?? failureReason) as (Error & { isForbidden?: boolean }) | null

  const giving = (data ?? []).filter((r) => r.group === 'Giving')

  return (
    <>
      <PageHeader
        title="Financial reports"
        subtitle="Period, fund, category and donor reporting"
      />

      <div className={`${CARD} p-4 sm:p-5 mb-4`}>
        <p className="text-sm text-muted-foreground max-w-prose">
          Each report opens with a date range and a comparison against the
          equal period before it, and exports to CSV or PDF. They read the same
          offerings as the dashboard and count the same statuses, so the figures
          here and there cannot drift apart.
        </p>
        <div className="flex flex-wrap gap-2 mt-4">
          <Chip className="bg-muted text-muted-foreground border-border">
            <CalendarRange className="size-3" aria-hidden /> any date range
          </Chip>
          <Chip className="bg-muted text-muted-foreground border-border">
            <FileDown className="size-3" aria-hidden /> CSV and PDF
          </Chip>
          <Chip className="bg-muted text-muted-foreground border-border">
            saved views and scheduled email
          </Chip>
        </div>
      </div>

      {isError || (!isLoading && !isFetching && !data) ? (
        <div className={CARD}>
          <ErrorState message={failure?.message} forbidden={failure?.isForbidden} onRetry={() => refetch()} />
        </div>
      ) : isLoading || !data ? (
        <div className={CARD}><TableSkeleton cols={2} /></div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {giving.map((r) => (
            <Link
              key={r.key}
              href={`/admin/reports?report=${r.key}`}
              className={`${CARD} p-4 sm:p-5 flex items-start gap-4 hover:border-primary/50 transition-colors group`}
            >
              <span className="grid place-items-center size-10 shrink-0 rounded-xl bg-primary/10">
                <BarChart3 className="size-5 text-primary" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2 font-medium">
                  {r.name}
                  {/* Said before the click: a report the module behind it cannot
                      serve returns nothing, and an empty table reads as "no
                      giving" rather than "not installed". */}
                  {!r.available && (
                    <Chip className="bg-muted text-muted-foreground border-border">not available</Chip>
                  )}
                </span>
                <span className="block text-sm text-muted-foreground mt-0.5">{r.description}</span>
              </span>
              <ArrowRight className="size-4 text-muted-foreground shrink-0 mt-1 group-hover:text-primary transition-colors" aria-hidden />
            </Link>
          ))}

          {!giving.length && (
            <div className={`${CARD} p-6 sm:col-span-2 text-center`}>
              <Lock className="size-6 text-muted-foreground mx-auto mb-2" aria-hidden />
              <p className="font-medium">No giving reports available to you</p>
              <p className="text-sm text-muted-foreground mt-1">
                Running these needs permission to view giving. Ask an administrator.
              </p>
            </div>
          )}
        </div>
      )}
    </>
  )
}
