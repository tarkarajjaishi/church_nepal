'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { MediaLibrary } from './MediaLibrary'
import { ImageIcon } from 'lucide-react'

interface MediaPickerProps {
  value: string
  onSelect: (url: string) => void
}

export function MediaPicker({ value, onSelect }: MediaPickerProps) {
  const [open, setOpen] = useState(false)

  const getImageSrc = (url: string) => {
    if (!url) return ''
    if (url.startsWith('http')) return url
    return `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3002'}${url}`
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="w-full h-7 text-xs"
      >
        {value && (value.startsWith('http') || value.startsWith('/')) ? (
          <img
            src={getImageSrc(value)}
            alt="Current"
            className="size-4 rounded-sm object-cover mr-1"
          />
        ) : (
          <ImageIcon className="size-3 mr-1" />
        )}
        Media Library
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Media Library</DialogTitle>
            <DialogDescription>Select an image from previously uploaded files.</DialogDescription>
          </DialogHeader>
          <div className="flex-1 min-h-0 overflow-hidden">
            <MediaLibrary
              onSelect={(url) => { onSelect(url); setOpen(false) }}
              onClose={() => setOpen(false)}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
