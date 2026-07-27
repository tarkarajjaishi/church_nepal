import { Check } from 'lucide-react'
import { THEME_PRESETS, lighten, type ThemePreset } from '@/lib/theme'

export type { ThemePreset }

export const HOMEPAGE_LAYOUTS = [
  { value: 'default',      label: 'Default',      description: 'Classic church layout with full-width hero' },
  { value: 'magazine',     label: 'Magazine',     description: 'Masonry-style grid, compact sections' },
  { value: 'minimal-hero', label: 'Minimal Hero', description: 'Smaller hero, more whitespace, larger type' },
  { value: 'full-width',   label: 'Full Width',   description: 'Full-bleed images, edge-to-edge sections' },
  { value: 'split',        label: 'Split',        description: 'Two-column alternating layout' },
  { value: 'centered',     label: 'Centered',     description: 'Narrow max-width, editorial feel' },
] as const

export type HomepageLayout = (typeof HOMEPAGE_LAYOUTS)[number]['value']

// ── Mini mockup card ─────────────────────────────────────────────────────────

interface PresetCardProps {
  preset:   ThemePreset
  isActive: boolean
  onSelect: (preset: ThemePreset) => void
}

function PresetCard({ preset, isActive, onSelect }: PresetCardProps) {
  const mid    = lighten(preset.primary, 0.28)
  const subtle = lighten(preset.primary, 0.88)
  const headingName = preset.headingFont.split(',')[0].replace(/'/g, '').trim()
  const bodyName    = preset.bodyFont.split(',')[0].replace(/'/g, '').trim()

  return (
    <button
      onClick={() => onSelect(preset)}
      className={`group relative flex flex-col overflow-hidden rounded-2xl border-2 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
        isActive
          ? 'border-church-blue shadow-lg ring-2 ring-church-blue/20 scale-[1.02]'
          : 'border-border hover:border-church-blue/50 hover:shadow-md'
      }`}
    >
      {/* ── Mini site mockup header ── */}
      <div
        className="relative h-28 overflow-hidden"
        style={{ background: `linear-gradient(145deg, ${preset.primary} 0%, ${mid} 100%)` }}
      >
        {/* Simulated nav bar */}
        <div
          className="absolute inset-x-0 top-0 h-6 flex items-center px-3 gap-2"
          style={{ backgroundColor: preset.primary + 'ee' }}
        >
          {/* Logo dot */}
          <div className="size-3 rounded-full bg-white/70 shrink-0" />
          {/* Nav links */}
          <div className="flex gap-1.5 flex-1">
            {[28, 22, 26, 20].map((w, i) => (
              <div key={i} className="h-1.5 rounded-full bg-white/30" style={{ width: w }} />
            ))}
          </div>
          {/* CTA button */}
          <div
            className="h-3 w-10 rounded-full"
            style={{ backgroundColor: preset.accent }}
          />
        </div>

        {/* Simulated hero text */}
        <div className="absolute bottom-0 left-0 right-0 px-4 pb-3 pt-6">
          <div className="h-3 rounded bg-white/80 mb-2" style={{ width: '70%' }} />
          <div className="h-2 rounded bg-white/50 mb-3" style={{ width: '50%' }} />
          {/* Hero CTA buttons */}
          <div className="flex gap-2">
            <div
              className="h-4 w-14 rounded-full"
              style={{ backgroundColor: preset.accent }}
            />
            <div className="h-4 w-12 rounded-full border border-white/40" />
          </div>
        </div>

        {/* Active checkmark overlay */}
        {isActive && (
          <div
            className="absolute top-2 right-2 flex items-center justify-center size-6 rounded-full shadow-md"
            style={{ backgroundColor: preset.accent }}
          >
            <Check className="size-3.5" style={{ color: preset.primary }} strokeWidth={3} />
          </div>
        )}
      </div>

      {/* ── Card body ── */}
      <div className="flex-1 flex flex-col gap-3 p-4 bg-card">
        {/* Name + active badge */}
        <div className="flex items-start justify-between gap-2">
          <span
            className="text-sm font-bold leading-tight text-foreground"
            style={{ fontFamily: `'${headingName}', serif` }}
          >
            {preset.label}
          </span>
          {isActive && (
            <span
              className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
              style={{ backgroundColor: preset.primary + '18', color: preset.primary }}
            >
              Active
            </span>
          )}
        </div>

        {/* Color palette row */}
        <div className="flex items-center gap-1.5">
          <span
            title={`Primary: ${preset.primary}`}
            className="size-5 rounded-full ring-2 ring-white/60 shadow-sm"
            style={{ backgroundColor: preset.primary }}
          />
          <span
            title="Mid tone"
            className="size-5 rounded-full ring-2 ring-white/60 shadow-sm"
            style={{ backgroundColor: mid }}
          />
          <span
            title={`Accent: ${preset.accent}`}
            className="size-5 rounded-full ring-2 ring-white/60 shadow-sm"
            style={{ backgroundColor: preset.accent }}
          />
          <span
            title="Subtle background"
            className="size-5 rounded-full ring-1 ring-border shadow-sm"
            style={{ backgroundColor: subtle }}
          />
        </div>

        {/* Description */}
        <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
          {preset.description}
        </p>

        {/* Font + layout meta */}
        <div className="flex items-center gap-2 mt-auto flex-wrap">
          <span className="inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
            {headingName}
          </span>
          <span className="inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-muted-foreground capitalize">
            {preset.layout.replace('-', ' ')}
          </span>
        </div>
      </div>
    </button>
  )
}

// ── Grid ─────────────────────────────────────────────────────────────────────

interface ThemePresetsProps {
  activePresetName: string | null
  onSelect: (preset: ThemePreset) => void
}

export function ThemePresets({ activePresetName, onSelect }: ThemePresetsProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-foreground">Church Theme Presets</h3>
        <p className="text-xs text-muted-foreground mt-1">
          One-click presets — each sets colors, typography, corner radius, and layout together.
          Click any card to preview live.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
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
