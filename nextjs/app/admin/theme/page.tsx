'use client'

import { useCallback, useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import { Palette, Monitor, Sun, Moon, Check, Loader2, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import api from '@/lib/admin/api'
import {
  THEME_PRESETS,
  THEME_SETTING_KEYS,
  DEFAULT_PRIMARY,
  DEFAULT_SKIN,
  DEFAULT_HEADING_FONT,
  DEFAULT_BODY_FONT,
  applyPrimaryColor,
  applySkin,
  applyFonts,
  applyPreset,
  loadGoogleFont,
  findPresetByName,
  isValidHex,
  type ThemePreset,
  type ThemeSkin,
} from '@/lib/theme'
import { ThemePresets, HOMEPAGE_LAYOUTS, type HomepageLayout } from '@/components/theme/ThemePresets'

const MODES = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
] as const

export default function ThemePage() {
  const { theme, setTheme } = useTheme()
  const [activePreset, setActivePreset] = useState<string | null>(null)
  const [primary, setPrimary] = useState<string>(DEFAULT_PRIMARY)
  const [skin, setSkin] = useState<ThemeSkin>(DEFAULT_SKIN)
  const [homepageLayout, setHomepageLayout] = useState<HomepageLayout>('default')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Load current settings
  useEffect(() => {
    api
      .get('/settings')
      .then(({ data }) => {
        if (!Array.isArray(data)) return
        const map = new Map<string, string>(data.map((r: any) => [r.key, r.value]))

        const presetName = map.get(THEME_SETTING_KEYS.theme_preset)
        if (presetName) {
          const preset = findPresetByName(presetName)
          if (preset) {
            setActivePreset(preset.name)
            applyPreset(preset)
            setPrimary(preset.primary)
          }
        } else {
          const p = map.get(THEME_SETTING_KEYS.primary)
          if (p && isValidHex(p)) {
            setPrimary(p)
            applyPrimaryColor(p)
          }
          const hFont = map.get(THEME_SETTING_KEYS.heading_font)
          const bFont = map.get(THEME_SETTING_KEYS.body_font)
          if (hFont && bFont) {
            applyFonts(hFont, bFont)
            loadGoogleFont(hFont)
            loadGoogleFont(bFont)
          }
        }

        const s = map.get(THEME_SETTING_KEYS.skin)
        if (s === 'bordered' || s === 'default') {
          setSkin(s)
          applySkin(s)
        }

        const layout = map.get(THEME_SETTING_KEYS.homepage_layout)
        if (layout && HOMEPAGE_LAYOUTS.some(l => l.value === layout)) {
          setHomepageLayout(layout as HomepageLayout)
          document.documentElement.setAttribute('data-homepage-layout', layout)
        }
      })
      .catch(() => {})
  }, [])

  const saveSetting = useCallback(async (key: string, value: string) => {
    return api.put(`/settings/${key}`, { value }).catch(() => {})
  }, [])

  const selectPreset = async (preset: ThemePreset) => {
    setActivePreset(preset.name)
    setPrimary(preset.primary)
    applyPreset(preset)
    setSaving(true)
    await Promise.all([
      saveSetting(THEME_SETTING_KEYS.primary, preset.primary),
      saveSetting(THEME_SETTING_KEYS.heading_font, preset.headingFont),
      saveSetting(THEME_SETTING_KEYS.body_font, preset.bodyFont),
      saveSetting(THEME_SETTING_KEYS.theme_preset, preset.name),
      saveSetting(THEME_SETTING_KEYS.homepage_layout, preset.layout),
    ])
    setHomepageLayout(preset.layout as HomepageLayout)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const changeLayout = async (layout: HomepageLayout) => {
    setHomepageLayout(layout)
    document.documentElement.setAttribute('data-homepage-layout', layout)
    await saveSetting(THEME_SETTING_KEYS.homepage_layout, layout)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const changePrimary = async (hex: string) => {
    setPrimary(hex)
    setActivePreset(null)
    if (isValidHex(hex)) {
      applyPrimaryColor(hex)
    }
    await Promise.all([
      saveSetting(THEME_SETTING_KEYS.primary, hex),
      saveSetting(THEME_SETTING_KEYS.theme_preset, ''),
    ])
  }

  const changeSkin = async (s: ThemeSkin) => {
    setSkin(s)
    applySkin(s)
    await saveSetting(THEME_SETTING_KEYS.skin, s)
  }

  const changeMode = async (m: string) => {
    setTheme(m)
    await saveSetting(THEME_SETTING_KEYS.mode, m)
  }

  const reset = async () => {
    setPrimary(DEFAULT_PRIMARY)
    setSkin(DEFAULT_SKIN)
    setHomepageLayout('default')
    setActivePreset(null)
    applyPrimaryColor(DEFAULT_PRIMARY)
    applySkin(DEFAULT_SKIN)
    applyFonts(DEFAULT_HEADING_FONT, DEFAULT_BODY_FONT)
    document.documentElement.setAttribute('data-homepage-layout', 'default')
    setTheme('system')
    await Promise.all([
      saveSetting(THEME_SETTING_KEYS.primary, DEFAULT_PRIMARY),
      saveSetting(THEME_SETTING_KEYS.skin, DEFAULT_SKIN),
      saveSetting(THEME_SETTING_KEYS.mode, 'system'),
      saveSetting(THEME_SETTING_KEYS.heading_font, ''),
      saveSetting(THEME_SETTING_KEYS.body_font, ''),
      saveSetting(THEME_SETTING_KEYS.theme_preset, ''),
      saveSetting(THEME_SETTING_KEYS.homepage_layout, 'default'),
    ])
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="max-w-5xl space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0b3c5d] flex items-center gap-2">
            <Palette className="size-6" /> Theme & Layout
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Customize the site-wide appearance. Changes apply to all visitors instantly.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {saved && (
            <span className="flex items-center gap-1.5 text-sm text-green-600">
              <Check className="size-4" /> Saved
            </span>
          )}
          <Button variant="outline" size="sm" onClick={reset}>
            <RotateCcw className="size-4 mr-1.5" /> Reset
          </Button>
        </div>
      </div>

      <Separator />

      {/* Theme Presets */}
      <ThemePresets activePresetName={activePreset} onSelect={selectPreset} />

      <Separator />

      {/* Homepage Layout */}
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Homepage Layout</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Choose how the homepage sections are arranged and styled.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {HOMEPAGE_LAYOUTS.map(layout => (
            <button
              key={layout.value}
              onClick={() => changeLayout(layout.value)}
              className={`flex flex-col items-start gap-1.5 rounded-xl border-2 p-4 text-left transition-all duration-200 ${
                homepageLayout === layout.value
                  ? 'border-church-blue bg-church-blue/5 shadow-md ring-2 ring-church-blue/20'
                  : 'border-border hover:border-church-blue/40 hover:shadow-sm'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-foreground">{layout.label}</span>
                {homepageLayout === layout.value && <Check className="size-4 text-church-blue" />}
              </div>
              <p className="text-xs text-muted-foreground">{layout.description}</p>
            </button>
          ))}
        </div>
      </div>

      <Separator />

      {/* Custom Color */}
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Custom Color</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Pick a primary color when no preset is active.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="relative size-10 shrink-0 overflow-hidden rounded-lg border border-border">
            <span className="absolute inset-0" style={{ backgroundColor: primary }} />
            <input
              type="color"
              value={isValidHex(primary) && primary.length >= 7 ? primary : DEFAULT_PRIMARY}
              onChange={e => changePrimary(e.target.value)}
              className="absolute inset-0 cursor-pointer opacity-0"
              aria-label="Pick custom color"
            />
          </span>
          <input
            type="text"
            value={primary}
            onChange={e => changePrimary(e.target.value)}
            placeholder="#0b3c5d"
            spellCheck={false}
            className="w-32 font-mono text-sm border border-border rounded-lg px-3 py-2 bg-background text-foreground"
          />
        </div>
      </div>

      <Separator />

      {/* Mode */}
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Default Mode</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Set the default light/dark mode for visitors who haven't chosen yet.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-3 max-w-md">
          {MODES.map(m => (
            <button
              key={m.value}
              onClick={() => changeMode(m.value)}
              className={`flex flex-col items-center gap-1.5 rounded-xl border-2 py-4 text-xs transition-all ${
                theme === m.value
                  ? 'border-church-blue bg-church-blue/5 text-church-blue'
                  : 'border-border text-muted-foreground hover:border-church-blue/40'
              }`}
            >
              <m.icon className="size-5" />
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <Separator />

      {/* Skin */}
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Skin</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Default uses shadows; Bordered adds visible card outlines.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 max-w-sm">
          {(['default', 'bordered'] as ThemeSkin[]).map(s => (
            <button
              key={s}
              onClick={() => changeSkin(s)}
              className={`rounded-xl border-2 py-4 text-sm capitalize transition-all ${
                skin === s
                  ? 'border-church-blue bg-church-blue/5 text-church-blue'
                  : 'border-border text-muted-foreground hover:border-church-blue/40'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
