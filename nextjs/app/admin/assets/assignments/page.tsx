'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ArrowLeftRight, AlertTriangle, Undo2 } from 'lucide-react'
import { assetsApi, CONDITIONS } from '@/lib/assets/api'
import {
  CARD, PageHeader, EmptyState, TableSkeleton, Chip, btn,
} from '@/components/offerings/ui'

export default function AssignmentsPage() {
  const qc = useQueryClient()
  const today = new Date().toISOString().slice(0, 10)

  const { data, isLoading } = useQuery({
    queryKey: ['asset-assignments'],
    queryFn: assetsApi.assignments,
  })

  const ret = useMutation({
    mutationFn: ({ id, condition }: { id: string; condition?: string }) =>
      assetsApi.returnAssignment(id, { condition_in: condition }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['asset-assignments'] })
      qc.invalidateQueries({ queryKey: ['assets'] })
      qc.invalidateQueries({ queryKey: ['asset-dashboard'] })
      toast.success('Return recorded')
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const onReturn = (id: string) => {
    const cond = window.prompt(`What condition is it back in? One of: ${CONDITIONS.join(', ')}`, 'good')
    if (cond === null) return
    ret.mutate({ id, condition: CONDITIONS.includes(cond) ? cond : undefined })
  }

  const open = (data ?? []).filter((a) => !a.returnedAt)
  const overdue = open.filter((a) => a.dueBack && a.dueBack < today)

  return (
    <>
      <PageHeader
        title="Check-out"
        subtitle={
          data
            ? `${open.length} out${overdue.length ? ` · ${overdue.length} overdue` : ''}`
            : undefined
        }
      />

      {overdue.length > 0 && (
        <div className={`${CARD} p-4 mb-4 border-red-500/40 bg-red-500/5`} role="status">
          <p className="text-sm font-medium inline-flex items-center gap-2">
            <AlertTriangle className="size-4 text-red-700" aria-hidden />
            {overdue.length} item{overdue.length === 1 ? '' : 's'} past the return date
          </p>
        </div>
      )}

      <div className={`${CARD} overflow-hidden`}>
        {isLoading ? (
          <TableSkeleton cols={6} />
        ) : !data?.length ? (
          <EmptyState
            icon={ArrowLeftRight}
            title="Nothing checked out"
            subtitle="Check an asset out from the register to track who has it."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10 bg-card/95 backdrop-blur border-b border-border">
                <tr>
                  {['Asset', 'With', 'Department', 'Out', 'Due back', 'Returned', 'Condition', ''].map((h) => (
                    <th key={h} scope="col" className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((a) => {
                  const isOverdue = !a.returnedAt && a.dueBack && a.dueBack < today
                  return (
                    <tr key={a.id} className={`border-b border-border last:border-0 transition-colors ${isOverdue ? 'bg-red-500/5' : 'hover:bg-muted/50'}`}>
                      <td className="px-4 py-3">
                        <p className="font-medium truncate max-w-[14rem]">{a.assetName}</p>
                        <p className="text-xs text-muted-foreground font-mono">{a.assetCode}</p>
                      </td>
                      <td className="px-4 py-3">{a.assignedTo || '—'}</td>
                      <td className="px-4 py-3 text-muted-foreground">{a.department || '—'}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">{a.assignedAt}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {a.dueBack ? (
                          <span className={isOverdue ? 'text-red-700 font-medium' : 'text-muted-foreground'}>
                            {a.dueBack}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">{a.returnedAt ?? '—'}</td>
                      <td className="px-4 py-3">
                        <Chip className="bg-muted text-foreground border-border">
                          {a.conditionIn ?? a.conditionOut}
                        </Chip>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {!a.returnedAt && (
                          <button type="button" onClick={() => onReturn(a.id)} disabled={ret.isPending} className={btn.secondary}>
                            <Undo2 className="size-3.5" aria-hidden /> Record return
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}
