'use client'

import { Check, Palette } from 'lucide-react'
import { THEME_PRESETS, type ThemePreset } from '@/lib/theme'

export type { ThemePreset }

export const HOMEPAGE_LAYOUTS = [
  { value: 'default', label: 'Default', description: 'Classic church layout with full-width hero' },
  { value: 'magazine', label: 'Magazine', description: 'Masonry-style grid, compact sections' },
  { value: 'minimal-hero', label: 'Minimal Hero', description: 'Smaller hero, more whitespace, larger type' },
  { value: 'full-width', label: 'Full Width', description: 'Full-bleed images, edge-to-edge sections' },
  { value: 'split', label: 'Split', description: 'Two-column alternating layout' },
  { value: 'centered', label: 'Centered', description: 'Narrow max-width, editorial feel' },
] as const

export type HomepageLayout = (typeof HOMEPAGE_LAYOUTS)[number]['value']

interface PresetCardProps {
  preset: ThemePreset
  isActive: boolean
  onSelect: (preset: ThemePreset) => void
}

function PresetCard({ preset, isActive, onSelect }: PresetCardProps) {
  return (
    <button
      onClick={() => onSelect(preset)}
      className={`group relative flex flex-col items-start gap-3 rounded-xl border-2 p-4 text-left transition-all duration-200 ${
        isActive
          ? 'border-church-blue bg-church-blue/5 shadow-md ring-2 ring-church-blue/20'
          : 'border-border hover:border-church-blue/40 hover:shadow-sm'
      }`}
    >
      {/* Color swatch + check */}
      <div className="flex items-center gap-3">
        <span
          className="size-10 shrink-0 rounded-lg ring-2 ring-black/10 shadow-inner transition-transform group-hover:scale-105"
          style={{ backgroundColor: preset.primary }}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-semibold text-foreground truncate">{preset.label}</span>
            {isActive && <Check className="size-4 shrink-0 text-church-blue" />}
          </div>
        </div>
      </div>

      {/* Font info */}
      <div className="space-y-1 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <span className="font-medium text-foreground/70">Heading:</span>
          <span className="truncate">{preset.headingFont.split(',')[0].replace(/'/g, '')}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="font-medium text-foreground/70">Body:</span>
          <span className="truncate">{preset.bodyFont.split(',')[0].replace(/'/g, '')}</span>
        </div>
      </div>

      {/* Layout badge */}
      <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-0.5 text-[10px] font-medium text-muted-foreground capitalize">
        {preset.layout}
      </span>
    </button>
  )
}

interface ThemePresetsProps {
  activePresetName: string | null
  onSelect: (preset: ThemePreset) => void
}

export function ThemePresets({ activePresetName, onSelect }: ThemePresetsProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Palette className="size-4 text-church-blue" />
        <h3 className="text-sm font-semibold text-foreground">Theme Presets</h3>
      </div>
      <p className="text-xs text-muted-foreground">
        One-click presets that set colors, fonts, and homepage layout together.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {THEME_PRESETS.map(preset => (
          <PresetCard
            key={preset.name}
            preset={preset}
            isActive={activePresetName === preset.name}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  )
}
