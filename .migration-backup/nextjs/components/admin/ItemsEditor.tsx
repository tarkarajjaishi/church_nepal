'use client'

import { useState, useRef } from 'react'
import { Plus, Trash2, ChevronUp, ChevronDown, Upload, ExternalLink, X } from 'lucide-react'
import { MediaPicker } from './MediaPicker'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { uploadFile } from '@/lib/admin/api'
import { toast } from 'sonner'

const IMAGE_KEYS = ['image', 'photo', 'thumbnail', 'hero_image', 'background']
const TEXTAREA_KEYS = ['description', 'desc', 'body', 'text', 'bio', 'content', 'long_text', 'summary']
const URL_KEYS = ['href', 'link', 'url', 'website', 'website_url']

function getFieldType(key: string): 'image' | 'textarea' | 'url' | 'text' {
  const lower = key.toLowerCase()
  if (IMAGE_KEYS.includes(lower)) return 'image'
  if (TEXTAREA_KEYS.includes(lower)) return 'textarea'
  if (URL_KEYS.includes(lower)) return 'url'
  return 'text'
}

interface ItemsEditorProps {
  items: Record<string, any>[]
  onChange: (items: Record<string, any>[]) => void
  /** Maximum number of fields to show per item in compact mode */
  maxFields?: number
}

/**
 * Repeats-list editor for the content block `items` JSON array.
 * Infers field keys from the first item, supports add/remove/reorder/add-key.
 * Detects field types by key name: image upload, textarea, URL inputs.
 */
export function ItemsEditor({ items, onChange, maxFields = 6 }: ItemsEditorProps) {
  const [newKey, setNewKey] = useState('')
  const fileInputRefs = useRef<Map<number, HTMLInputElement>>(new Map())

  // Derive field keys from all items (union of keys)
  const fieldKeys: string[] = Array.from(
    new Set(items.flatMap(item => Object.keys(item)))
  )

  const updateItem = (index: number, key: string, value: any) => {
    const next = items.map((item, i) =>
      i === index ? { ...item, [key]: value } : item
    )
    onChange(next)
  }

  const addItem = () => {
    // Create a new blank item with all existing keys
    const blank: Record<string, any> = {}
    for (const k of fieldKeys) blank[k] = ''
    onChange([...items, blank])
  }

  const removeItem = (index: number) => {
    onChange(items.filter((_, i) => i !== index))
  }

  const moveItem = (index: number, direction: 'up' | 'down') => {
    const target = direction === 'up' ? index - 1 : index + 1
    if (target < 0 || target >= items.length) return
    const next = [...items]
    const tmp = next[index]
    next[index] = next[target]
    next[target] = tmp
    onChange(next)
  }

  const addKey = () => {
    const trimmed = newKey.trim()
    if (!trimmed || fieldKeys.includes(trimmed)) return
    // Add the new key to every existing item
    const next = items.map(item => ({ ...item, [trimmed]: '' }))
    onChange(next)
    setNewKey('')
  }

  const removeKey = (key: string) => {
    if (fieldKeys.length <= 1) return // keep at least one key
    const next = items.map(item => {
      const { [key]: _, ...rest } = item
      return rest
    })
    onChange(next)
  }

  const handleImageUpload = async (index: number, fieldKey: string, file: File) => {
    try {
      const result = await uploadFile(file)
      updateItem(index, fieldKey, result.url)
    } catch {
      toast.error('Image upload failed')
    }
  }

  const triggerFileInput = (index: number) => {
    fileInputRefs.current.get(index)?.click()
  }

  if (items.length === 0) {
    return (
      <div className="space-y-3">
        <p className="text-xs text-muted-foreground">No items yet.</p>
        <Button type="button" variant="outline" size="sm" onClick={addItem}>
          <Plus className="size-3.5 mr-1" /> Add First Item
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {items.map((item, idx) => (
        <div key={idx} className="relative rounded-md border border-border p-3 space-y-2">
          {/* Reorder / remove toolbar */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Item {idx + 1}</span>
            <div className="flex items-center gap-0.5">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="size-6 p-0"
                disabled={idx === 0}
                onClick={() => moveItem(idx, 'up')}
              >
                <ChevronUp className="size-3.5" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="size-6 p-0"
                disabled={idx === items.length - 1}
                onClick={() => moveItem(idx, 'down')}
              >
                <ChevronDown className="size-3.5" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="size-6 p-0 text-destructive hover:text-destructive"
                onClick={() => removeItem(idx)}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          </div>

          {/* Field inputs */}
          {fieldKeys.slice(0, maxFields).map(fieldKey => {
            const fieldType = getFieldType(fieldKey)
            const value = item[fieldKey] ?? ''

            if (fieldType === 'image') {
              return (
                <div key={fieldKey} className="space-y-1">
                  <Label className="text-xs capitalize">{fieldKey}</Label>
                  <div className="flex items-start gap-2">
                    {/* Thumbnail preview */}
                    <div className="relative shrink-0">
                      {value && typeof value === 'string' && (value.startsWith('http') || value.startsWith('/')) ? (
                        <img
                          src={value}
                          alt={fieldKey}
                          className="h-16 w-16 rounded-md object-cover border border-border"
                        />
                      ) : (
                        <div className="h-16 w-16 rounded-md border border-dashed border-border flex items-center justify-center text-muted-foreground">
                          <Upload className="size-4" />
                        </div>
                      )}
                      {/* Clear button */}
                      {value && (
                        <button
                          type="button"
                          onClick={() => updateItem(idx, fieldKey, '')}
                          className="absolute -top-1 -right-1 size-4 rounded-full bg-destructive text-white flex items-center justify-center hover:bg-destructive/90"
                        >
                          <X className="size-2.5" />
                        </button>
                      )}
                    </div>
                    <div className="flex-1 space-y-1">
                      {/* Upload button */}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        ref={el => {
                          if (el) fileInputRefs.current.set(idx, el)
                        }}
                        onChange={e => {
                          const file = e.target.files?.[0]
                          if (file) handleImageUpload(idx, fieldKey, file)
                          e.target.value = ''
                        }}
                      />
                      <div className="flex gap-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => triggerFileInput(idx)}
                          className="flex-1 h-7 text-xs"
                        >
                          <Upload className="size-3 mr-1" /> Upload
                        </Button>
                        <MediaPicker value={value} onSelect={(url) => updateItem(idx, fieldKey, url)} />
                      </div>
                      {/* Manual URL input */}
                      <Input
                        value={value}
                        onChange={e => updateItem(idx, fieldKey, e.target.value)}
                        className="h-7 text-xs"
                        placeholder="Or paste image URL"
                      />
                    </div>
                  </div>
                </div>
              )
            }

            if (fieldType === 'textarea') {
              return (
                <div key={fieldKey} className="space-y-1">
                  <Label className="text-xs capitalize">{fieldKey}</Label>
                  <Textarea
                    value={value}
                    onChange={e => updateItem(idx, fieldKey, e.target.value)}
                    rows={3}
                    className="text-sm"
                    placeholder={fieldKey}
                  />
                </div>
              )
            }

            if (fieldType === 'url') {
              return (
                <div key={fieldKey} className="space-y-1">
                  <Label className="text-xs capitalize">{fieldKey}</Label>
                  <div className="relative">
                    <ExternalLink className="absolute left-2 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                    <Input
                      value={value}
                      onChange={e => updateItem(idx, fieldKey, e.target.value)}
                      className="h-8 text-sm pl-7"
                      placeholder={fieldKey}
                      type="url"
                    />
                  </div>
                </div>
              )
            }

            // Default: plain text input
            return (
              <div key={fieldKey} className="space-y-1">
                <Label className="text-xs capitalize">{fieldKey}</Label>
                <Input
                  value={value}
                  onChange={e => updateItem(idx, fieldKey, e.target.value)}
                  className="h-8 text-sm"
                  placeholder={fieldKey}
                />
              </div>
            )
          })}
        </div>
      ))}

      {/* Add item */}
      <Button type="button" variant="outline" size="sm" onClick={addItem}>
        <Plus className="size-3.5 mr-1" /> Add Item
      </Button>

      {/* Add new field key */}
      <div className="flex items-end gap-2 pt-2 border-t border-border/50">
        <div className="flex-1 space-y-1">
          <Label className="text-xs">Add New Field Key</Label>
          <Input
            value={newKey}
            onChange={e => setNewKey(e.target.value)}
            placeholder="e.g. description"
            className="h-8 text-sm"
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addKey() } }}
          />
        </div>
        <Button type="button" variant="outline" size="sm" onClick={addKey} className="mb-px">
          <Plus className="size-3.5 mr-1" /> Add
        </Button>
      </div>

      {/* Manage existing keys */}
      {fieldKeys.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {fieldKeys.map(k => (
            <span
              key={k}
              className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-0.5 text-xs font-medium"
            >
              {k}
              {fieldKeys.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeKey(k)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  ×
                </button>
              )}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
