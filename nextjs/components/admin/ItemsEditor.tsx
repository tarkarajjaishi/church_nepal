'use client'

import { useState } from 'react'
import { Plus, Trash2, ChevronUp, ChevronDown } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

interface ItemsEditorProps {
  items: Record<string, any>[]
  onChange: (items: Record<string, any>[]) => void
  /** Maximum number of fields to show per item in compact mode */
  maxFields?: number
}

/**
 * Repeats-list editor for the content block `items` JSON array.
 * Infers field keys from the first item, supports add/remove/reorder/add-key.
 */
export function ItemsEditor({ items, onChange, maxFields = 6 }: ItemsEditorProps) {
  const [newKey, setNewKey] = useState('')

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
          {fieldKeys.slice(0, maxFields).map(fieldKey => (
            <div key={fieldKey} className="space-y-1">
              <Label className="text-xs capitalize">{fieldKey}</Label>
              <Input
                value={item[fieldKey] ?? ''}
                onChange={e => updateItem(idx, fieldKey, e.target.value)}
                className="h-8 text-sm"
                placeholder={fieldKey}
              />
            </div>
          ))}
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
