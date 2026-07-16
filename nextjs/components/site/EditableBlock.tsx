'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useQueryClient } from '@tanstack/react-query'
import { Pencil, Check, Loader2, X, ExternalLink, ArrowRight } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { useIsAdmin } from '@/lib/useIsAdmin'
import api from '@/lib/admin/api'
import type { ContentBlock } from '@/lib/hooks'

interface EditableBlockProps {
  block: ContentBlock | null | undefined
  children: React.ReactNode
  /** For sections whose items live in a DB table, link the pen to that admin page. */
  adminHref?: string
  adminLabel?: string
}

export function EditableBlock({ block, children, adminHref, adminLabel }: EditableBlockProps) {
  const { isAdmin } = useIsAdmin()
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [form, setForm] = useState({
    title: '',
    subtitle: '',
    body: '',
    eyebrow: '',
  })
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Populate form when block changes or popover opens
  useEffect(() => {
    if (open && block) {
      const firstItem = Array.isArray(block.items) ? block.items[0] : (block.items || {})
      setForm({
        title: block.title ?? '',
        subtitle: block.subtitle ?? '',
        body: block.body ?? '',
        eyebrow: firstItem?.eyebrow ?? '',
      })
    }
  }, [open, block])

  const saveToApi = useCallback(async (updates: Record<string, any>) => {
    if (!block) return
    setSaving(true)
    setSaved(false)
    try {
      await api.put(`/content-blocks/${block.id}`, updates)
      queryClient.invalidateQueries({ queryKey: ['content-blocks'] })
      setSaved(true)
      toast.success('Saved', { duration: 1500 })
      setTimeout(() => setSaved(false), 2000)
    } catch {
      toast.error('Save failed')
    } finally {
      setSaving(false)
    }
  }, [block, queryClient])

  // Debounced auto-save
  const debouncedSave = useCallback((updates: Record<string, any>) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      saveToApi(updates)
    }, 800)
  }, [saveToApi])

  // Cleanup timer
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    }
  }, [])

  const updateField = (key: string, value: string) => {
    setForm(prev => {
      const next = { ...prev, [key]: value }
      // Build the API payload
      const payload: Record<string, any> = {}
      if (key === 'eyebrow') {
        // Eyebrow lives inside items[0]
        const firstItem = Array.isArray(block?.items) ? block?.items[0] : (block?.items || {})
        const updatedItems = [{ ...(firstItem || {}), eyebrow: value }]
        payload.items = updatedItems
      } else {
        payload[key] = value
      }
      debouncedSave(payload)
      return next
    })
  }

  if (!isAdmin) return <>{children}</>

  return (
    <div className="relative group">
      {children}
      {/* Highlight the editable region while an admin hovers it */}
      <div className="pointer-events-none absolute inset-0 z-20 ring-2 ring-inset ring-transparent transition-colors duration-200 group-hover:ring-church-blue/40" />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            className="absolute top-3 right-3 z-40 flex items-center gap-1.5 rounded-full bg-church-blue px-3 py-1.5 text-xs font-medium text-white shadow-lg opacity-0 transition-opacity duration-200 group-hover:opacity-100 hover:bg-church-blue/90"
            onClick={(e) => e.stopPropagation()}
          >
            <Pencil className="size-3.5" /> Edit
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-4" align="end" side="bottom">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-church-blue">Edit Section</h3>
              <div className="flex items-center gap-1">
                {saving && <Loader2 className="size-3.5 animate-spin text-muted-foreground" />}
                {saved && <Check className="size-3.5 text-green-500" />}
                <Button variant="ghost" size="sm" className="size-6 p-0" onClick={() => setOpen(false)}>
                  <X className="size-3.5" />
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Title</Label>
              <Input
                value={form.title}
                onChange={e => updateField('title', e.target.value)}
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Subtitle</Label>
              <Textarea
                value={form.subtitle}
                onChange={e => updateField('subtitle', e.target.value)}
                rows={2}
                className="text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Eyebrow</Label>
              <Input
                value={form.eyebrow}
                onChange={e => updateField('eyebrow', e.target.value)}
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Body</Label>
              <Textarea
                value={form.body}
                onChange={e => updateField('body', e.target.value)}
                rows={3}
                className="text-sm"
              />
            </div>
            {adminHref && (
              <Link
                href={adminHref}
                onClick={() => setOpen(false)}
                className="mt-1 flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm font-medium text-church-blue transition-colors hover:bg-secondary"
              >
                <span className="flex items-center gap-2">
                  <ExternalLink className="size-3.5" />
                  Manage {adminLabel || 'items'} in admin
                </span>
                <ArrowRight className="size-3.5" />
              </Link>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
