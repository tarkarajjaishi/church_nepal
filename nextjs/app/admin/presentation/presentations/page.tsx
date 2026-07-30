'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Presentation, Trash2, Layers } from 'lucide-react'
import { presentationApi } from '@/lib/presentation/api'
import { CARD, PageHeader, EmptyState, TableSkeleton, Chip, btn } from '@/components/offerings/ui'

export default function PresentationsPage() {
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({
    queryKey: ['presentations'],
    queryFn: () => presentationApi.presentations(),
  })

  const remove = useMutation({
    mutationFn: (id: string) => presentationApi.deletePresentation(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['presentations'] }); toast.success('Presentation deleted') },
    onError: (e: Error) => toast.error(e.message),
  })

  return (
    <>
      <PageHeader
        title="Presentations"
        subtitle="Slide decks built from songs, scripture and announcements"
      />
      <div className={`${CARD} overflow-hidden`}>
        {isLoading ? (
          <TableSkeleton cols={5} />
        ) : !data?.length ? (
          <EmptyState
            icon={Presentation}
            title="No presentations yet"
            subtitle="Build one from the Song Library — open a song and choose Slides."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10 bg-card/95 backdrop-blur border-b border-border">
                <tr>
                  {['Title', 'Type', 'Slides', 'Used', 'Updated', ''].map((h) => (
                    <th key={h} scope="col" className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((p) => (
                  <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3 font-medium">{p.title}</td>
                    <td className="px-4 py-3"><Chip className="bg-muted text-foreground border-border">{p.kind}</Chip></td>
                    <td className="px-4 py-3 tabular-nums">
                      <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                        <Layers className="size-3.5" aria-hidden />{p.slideCount}
                      </span>
                    </td>
                    <td className="px-4 py-3 tabular-nums text-muted-foreground">{p.useCount}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{p.updatedAt?.slice(0, 10)}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => { if (window.confirm(`Delete "${p.title}"?`)) remove.mutate(p.id) }}
                        className={btn.ghost}
                        aria-label={`Delete ${p.title}`}
                      >
                        <Trash2 className="size-3.5 text-destructive" aria-hidden />
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
