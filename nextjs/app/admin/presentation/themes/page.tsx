'use client'

import { useQuery } from '@tanstack/react-query'
import { Palette } from 'lucide-react'
import { presentationApi } from '@/lib/presentation/api'
import { CARD, PageHeader, EmptyState, Chip } from '@/components/offerings/ui'

export default function ThemesPage() {
  const { data, isLoading } = useQuery({ queryKey: ['themes'], queryFn: presentationApi.themes })

  return (
    <>
      <PageHeader title="Themes" subtitle="Typography, colour and background for slides" />
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => <div key={i} className={`${CARD} h-44 animate-pulse`} />)}
        </div>
      ) : !data?.length ? (
        <div className={CARD}>
          <EmptyState icon={Palette} title="No themes" subtitle="Migration 062 seeds a default theme." />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((t) => (
            <div key={t.id} className={`${CARD} overflow-hidden`}>
              {/* Rendered with the theme's own values so the card is the preview. */}
              <div
                className="aspect-video flex items-center justify-center p-4"
                style={{
                  backgroundColor: t.backgroundColor,
                  color: t.textColor,
                  fontFamily: t.fontFamily,
                  backgroundImage: t.backgroundImage ? `url(${t.backgroundImage})` : undefined,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              >
                <p className="text-lg font-semibold text-center text-balance">Amazing grace,<br />how sweet the sound</p>
              </div>
              <div className="p-4 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium truncate">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.textAlign} · {t.verticalAlign} · {t.transition}</p>
                </div>
                {t.isDefault && <Chip className="bg-primary/10 text-primary border-primary/20">Default</Chip>}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
