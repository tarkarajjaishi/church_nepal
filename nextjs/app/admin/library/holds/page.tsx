'use client'

import Link from 'next/link'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Clock, X, BellRing } from 'lucide-react'
import { libraryApi } from '@/lib/library/api'
import {
  CARD, PageHeader, EmptyState, ErrorState, TableSkeleton, Chip, btn,
} from '@/components/offerings/ui'

export default function HoldsPage() {
  const qc = useQueryClient()
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['library', 'holds'],
    queryFn: libraryApi.holds,
  })

  const cancel = useMutation({
    mutationFn: (id: string) => libraryApi.cancelHold(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['library'] })
      toast.success('Hold cancelled')
    },
    onError: (e: Error) => toast.error(e.message || 'Could not cancel this hold'),
  })

  const ready = data?.filter((h) => h.status === 'ready') ?? []

  return (
    <>
      <PageHeader
        title="Holds"
        subtitle="Who is waiting for a title that is currently all out"
      />

      {ready.length > 0 && (
        <div className="rounded-2xl border border-green-200 bg-green-50 p-4 mb-4 flex items-start gap-3">
          <BellRing className="size-5 shrink-0 text-green-700 mt-0.5" aria-hidden />
          <div className="text-sm text-green-900">
            <p className="font-medium">{ready.length} book{ready.length === 1 ? ' is' : 's are'} back and reserved</p>
            <p className="mt-0.5">
              {ready.map((h) => `${h.requesterName} (${h.bookTitle})`).join(', ')} — let them know it is waiting.
            </p>
          </div>
        </div>
      )}

      <div className={`${CARD} overflow-hidden`}>
        {error ? (
          <ErrorState message={(error as Error).message} onRetry={() => refetch()} />
        ) : isLoading ? (
          <TableSkeleton cols={5} />
        ) : !data?.length ? (
          <EmptyState
            icon={Clock}
            title="Nobody is waiting"
            subtitle="A hold can only be placed when every copy of a title is out."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10 bg-card/95 backdrop-blur border-b border-border">
                <tr>
                  {['Book', 'Waiting', 'Place', 'Since', 'Status', ''].map((h, i) => (
                    <th key={i} scope="col" className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((h) => (
                  <tr key={h.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/admin/library/catalogue/${h.bookId}`} className="font-medium hover:text-primary transition-colors">
                        {h.bookTitle}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <p>{h.requesterName}</p>
                      {h.requesterContact && <p className="text-xs text-muted-foreground">{h.requesterContact}</p>}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-muted-foreground">#{h.queuePosition}</td>
                    <td className="px-4 py-3 text-muted-foreground tabular-nums whitespace-nowrap">
                      {h.createdAt.slice(0, 10)}
                    </td>
                    <td className="px-4 py-3">
                      {h.status === 'ready'
                        ? <Chip className="bg-green-100 text-green-800 border-green-200">Ready to collect</Chip>
                        : <Chip className="bg-amber-100 text-amber-800 border-amber-200">Waiting</Chip>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button type="button" onClick={() => cancel.mutate(h.id)} disabled={cancel.isPending} className={btn.ghost}>
                        <X className="size-3.5" aria-hidden /> Cancel
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}
