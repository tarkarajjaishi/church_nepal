'use client'

import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/admin/api'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, ImageIcon, Loader2 } from 'lucide-react'

interface UploadItem {
  filename: string
  url: string
  originalName: string
  contentType: string
  size: number
  createdAt: string
}

interface MediaLibraryProps {
  onSelect: (url: string) => void
  onClose: () => void
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function MediaLibrary({ onSelect, onClose }: MediaLibraryProps) {
  const [selected, setSelected] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const { data: images = [], isLoading } = useQuery({
    queryKey: ['uploads'],
    queryFn: () => api.get('/uploads').then(r => r.data as UploadItem[]),
  })

  const filtered = useMemo(() => {
    if (!search) return images
    const term = search.toLowerCase()
    return images.filter(img =>
      img.originalName.toLowerCase().includes(term) ||
      img.filename.toLowerCase().includes(term)
    )
  }, [images, search])

  const handleConfirm = () => {
    if (selected) {
      onSelect(selected)
      onClose()
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Search bar */}
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search images..."
          className="pl-9 h-8 text-sm"
        />
      </div>

      {/* Image grid */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <ImageIcon className="size-10 mb-2 opacity-40" />
            <p className="text-sm">
              {images.length === 0 ? 'No uploads yet.' : 'No images match your search.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {filtered.map(img => (
              <button
                key={img.filename}
                type="button"
                onClick={() => setSelected(img.url)}
                className={`relative group rounded-lg overflow-hidden border-2 transition-all ${
                  selected === img.url
                    ? 'border-church-blue ring-2 ring-church-blue/30'
                    : 'border-transparent hover:border-gray-300'
                }`}
              >
                <img
                  src={img.url}
                  alt={img.originalName}
                  className="w-full aspect-square object-cover"
                  loading="lazy"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-1.5">
                  <p className="text-white text-[10px] leading-tight truncate">{img.originalName}</p>
                  <p className="text-white/70 text-[9px]">{formatFileSize(img.size)}</p>
                </div>
                {selected === img.url && (
                  <div className="absolute top-1 right-1 size-5 bg-church-blue rounded-full flex items-center justify-center">
                    <svg className="size-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Confirm / Cancel */}
      <div className="flex justify-end gap-2 pt-3 border-t mt-3">
        <Button type="button" variant="outline" size="sm" onClick={onClose}>Cancel</Button>
        <Button
          type="button"
          size="sm"
          onClick={handleConfirm}
          disabled={!selected}
          className="bg-church-blue hover:bg-church-blue/90"
        >
          Select Image
        </Button>
      </div>
    </div>
  )
}
