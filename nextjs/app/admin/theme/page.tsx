'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
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
  DEFAULT_RADIUS,
  DEFAULT_LOGO,
  applyPrimaryColor,
  applySkin,
  applyFonts,
  applyRadius,
  applyPreset,
  loadGoogleFont,
  findPresetByName,
  isValidHex,
  saveThemeDraft,
  publishTheme,
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
  const [themeSettings, setThemeSettings] = useState<Record<string, string>>({})
  const [draftExists, setDraftExists] = useState(false)
  const [loading, setLoading] = useState(true)
  const [publishing, setPublishing] = useState(false)
  const [published, setPublished] = useState(false)
  const [saving, setSaving] = useState(false)
  const saveTimer = useRef<ReturnType<typeof setTimeout>>()

  const activePreset = findPresetByName(themeSettings[THEME_SETTING_KEYS.theme_preset] || '')
  const primary = isValidHex(themeSettings[THEME_SETTING_KEYS.primary]) && themeSettings[THEME_SETTING_KEYS.primary].length >= 7
    ? themeSettings[THEME_SETTING_KEYS.primary]
    : DEFAULT_PRIMARY
  const skin = (themeSettings[THEME_SETTING_KEYS.skin] as ThemeSkin) || DEFAULT_SKIN
  const mode = themeSettings[THEME_SETTING_KEYS.mode] || DEFAULT_MODE
  const homepageLayout = themeSettings[THEME_SETTING_KEYS.homepage_layout] || 'default'
  const radius = themeSettings[THEME_SETTING_KEYS.radius] || DEFAULT_RADIUS
  const logo = themeSettings[THEME_SETTING_KEYS.logo] || ''

  useEffect(() => {
    async function load() {
      try {
        const { data: settings } = await api.get('/settings')
        const pubMap = new Map<string, string>(settings.map((r: any) => [r.key, r.value]))

        let draftData: Record<string, string> | null = null
        try {
          const { data: draftRes } = await api.get('/settings/theme/draft')
          if (draftRes && Object.keys(draftRes).length > 0) {
            draftData = draftRes
          }
        } catch {}

        const effective = draftData ? { ...Object.fromEntries(pubMap), ...draftData } : Object.fromEntries(pubMap)
        setDraftExists(!!draftData)
        setThemeSettings(effective)

        const p = effective[THEME_SETTING_KEYS.primary]
        if (p && isValidHex(p)) applyPrimaryColor(p)

        const s = effective[THEME_SETTING_KEYS.skin]
        if (s === 'bordered' || s === 'default') applySkin(s)

        const hFont = effective[THEME_SETTING_KEYS.heading_font]
        const bFont = effective[THEME_SETTING_KEYS.body_font]
        if (hFont && bFont) {
          applyFonts(hFont, bFont)
          loadGoogleFont(hFont)
          loadGoogleFont(bFont)
        }

        if (effective[THEME_SETTING_KEYS.theme_preset]) {
          const preset = findPresetByName(effective[THEME_SETTING_KEYS.theme_preset])
          if (preset) applyPreset(preset)
        }

        const layout = effective[THEME_SETTING_KEYS.homepage_layout]
        if (layout) document.documentElement.setAttribute('data-homepage-layout', layout)

        const r = effective[THEME_SETTING_KEYS.radius]
        if (r) applyRadius(r)

        const l = effective[THEME_SETTING_KEYS.logo]
        if (l) document.documentElement.setAttribute('data-theme-logo', l)
      } catch {}
      setLoading(false)
    }
    load()
  }, [])

  const debouncedSave = useCallback((next: Record<string, string>) => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    setSaving(true)
    saveTimer.current = setTimeout(async () => {
      await saveThemeDraft(api, next)
      setDraftExists(true)
      setSaving(false)
    }, 400)
  }, [])

  const updateSetting = useCallback((key: string, value: string) => {
    setThemeSettings(prev => {
      const next = { ...prev, [key]: value }
      debouncedSave(next)
      return next
    })
  }, [debouncedSave])

  const selectPreset = async (preset: ThemePreset) => {
    const next = {
      ...themeSettings,
      [THEME_SETTING_KEYS.primary]: preset.primary,
      [THEME_SETTING_KEYS.heading_font]: preset.headingFont,
      [THEME_SETTING_KEYS.body_font]: preset.bodyFont,
      [THEME_SETTING_KEYS.theme_preset]: preset.name,
      [THEME_SETTING_KEYS.homepage_layout]: preset.layout,
    }
    setThemeSettings(next)
    applyPreset(preset)
    loadGoogleFont(preset.headingFont)
    loadGoogleFont(preset.bodyFont)
    if (saveTimer.current) clearTimeout(saveTimer.current)
    setSaving(true)
    await saveThemeDraft(api, next)
    setDraftExists(true)
    setSaving(false)
  }

  const changeLayout = async (layout: HomepageLayout) => {
    const next = { ...themeSettings, [THEME_SETTING_KEYS.homepage_layout]: layout }
    setThemeSettings(next)
    document.documentElement.setAttribute('data-homepage-layout', layout)
    await saveThemeDraft(api, next)
    setDraftExists(true)
  }

  const changePrimary = async (hex: string) => {
    const next = { ...themeSettings, [THEME_SETTING_KEYS.primary]: hex, [THEME_SETTING_KEYS.theme_preset]: '' }
    setThemeSettings(next)
    if (isValidHex(hex)) applyPrimaryColor(hex)
    await saveThemeDraft(api, next)
    setDraftExists(true)
  }

  const changeSkin = async (s: ThemeSkin) => {
    const next = { ...themeSettings, [THEME_SETTING_KEYS.skin]: s }
    setThemeSettings(next)
    applySkin(s)
    await saveThemeDraft(api, next)
    setDraftExists(true)
  }

  const changeMode = async (m: string) => {
    const next = { ...themeSettings, [THEME_SETTING_KEYS.mode]: m }
    setThemeSettings(next)
    setTheme(m)
    await saveThemeDraft(api, next)
    setDraftExists(true)
  }

  const changeRadius = async (r: string) => {
    const next = { ...themeSettings, [THEME_SETTING_KEYS.radius]: r }
    setThemeSettings(next)
    applyRadius(r)
    await saveThemeDraft(api, next)
    setDraftExists(true)
  }

  const changeLogo = async (l: string) => {
    const next = { ...themeSettings, [THEME_SETTING_KEYS.logo]: l }
    setThemeSettings(next)
    if (l) document.documentElement.setAttribute('data-theme-logo', l)
    else document.documentElement.removeAttribute('data-theme-logo')
    await saveThemeDraft(api, next)
    setDraftExists(true)
  }

  const reset = async () => {
    const next: Record<string, string> = {
      [THEME_SETTING_KEYS.primary]: DEFAULT_PRIMARY,
      [THEME_SETTING_KEYS.skin]: DEFAULT_SKIN,
      [THEME_SETTING_KEYS.mode]: DEFAULT_MODE,
      [THEME_SETTING_KEYS.heading_font]: DEFAULT_HEADING_FONT,
      [THEME_SETTING_KEYS.body_font]: DEFAULT_BODY_FONT,
      [THEME_SETTING_KEYS.theme_preset]: '',
      [THEME_SETTING_KEYS.homepage_layout]: 'default',
      [THEME_SETTING_KEYS.radius]: DEFAULT_RADIUS,
      [THEME_SETTING_KEYS.logo]: '',
    }
    setThemeSettings(next)
    applyPrimaryColor(DEFAULT_PRIMARY)
    applySkin(DEFAULT_SKIN)
    applyFonts(DEFAULT_HEADING_FONT, DEFAULT_BODY_FONT)
    applyRadius(DEFAULT_RADIUS)
    setTheme('system')
    document.documentElement.setAttribute('data-homepage-layout', 'default')
    document.documentElement.removeAttribute('data-theme-logo')
    await saveThemeDraft(api, next)
    setDraftExists(true)
  }

  const handlePublish = async () => {
    setPublishing(true)
    try {
      await publishTheme(api, themeSettings)
      setPublished(true)
      setDraftExists(true)
      setTimeout(() => setPublished(false), 2000)
    } catch {}
    setPublishing(false)
  }

  useEffect(() => {
    const timers = saveTimer.current
    return () => { if (timers) clearTimeout(timers) }
  }, [])

  if (loading) {
    return <div className="flex items-center justify-center py-20">
      <Loader2 className="size-8 animate-spin text-church-blue" />
    </div>
  }

  return (
    <div className="max-w-5xl space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-church-blue flex items-center gap-2">
            <Palette className="size-6" /> Theme & Layout
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {draftExists ? 'Editing draft · changes are not public until published' : 'Customize the site-wide appearance. Changes are saved as a draft.'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {published && (
            <span className="flex items-center gap-1.5 text-sm text-green-600">
              <Check className="size-4" /> Published
            </span>
          )}
          {saving && (
            <span className="text-xs text-muted-foreground">Saving…</span>
          )}
          <Button variant="outline" size="sm" onClick={reset}>
            <RotateCcw className="size-4 mr-1.5" /> Reset
          </Button>
          <Button size="sm" onClick={handlePublish} disabled={publishing || !draftExists}>
            {publishing && <Loader2 className="size-4 mr-1.5 animate-spin" />}
            Publish
          </Button>
        </div>
      </div>

      <Separator />

      <ThemePresets activePresetName={activePreset?.name || null} onSelect={selectPreset} />

      <Separator />

      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Border Radius</h3>
          <p className="text-xs text-muted-foreground mt-1">Controls the roundness of buttons, cards, and inputs.</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={radius}
            onChange={e => changeRadius(e.target.value)}
            className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="0rem">None (0rem)</option>
            <option value="0.375rem">Small (0.375rem)</option>
            <option value="0.5rem">Medium (0.5rem)</option>
            <option value="0.875rem">Default (0.875rem)</option>
            <option value="1rem">Large (1rem)</option>
            <option value="1.5rem">XL (1.5rem)</option>
            <option value="2rem">2XL (2rem)</option>
          </select>
          <span className="text-xs text-muted-foreground">Current: {radius}</span>
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Logo URL</h3>
          <p className="text-xs text-muted-foreground mt-1">Set a custom logo image URL for the site header.</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={logo}
            onChange={e => changeLogo(e.target.value)}
            placeholder="https://example.com/logo.png"
            spellCheck={false}
            className="flex-1 font-mono text-sm border border-border rounded-lg px-3 py-2 bg-background text-foreground outline-none focus:ring-2 focus:ring-ring"
          />
          {logo && (
            <div className="relative size-10 shrink-0 rounded-lg border border-border overflow-hidden">
              <img src={logo} alt="Logo preview" className="size-full object-cover" />
            </div>
          )}
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Custom Color</h3>
          <p className="text-xs text-muted-foreground mt-1">Pick a primary color when no preset is active.</p>
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
            value={themeSettings[THEME_SETTING_KEYS.primary] || ''}
            onChange={e => changePrimary(e.target.value)}
            placeholder="#0b3c5d"
            spellCheck={false}
            className="w-32 font-mono text-sm border border-border rounded-lg px-3 py-2 bg-background text-foreground outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Default Mode</h3>
          <p className="text-xs text-muted-foreground mt-1">Set the default light/dark mode for visitors who haven't chosen yet.</p>
        </div>
        <div className="grid grid-cols-3 gap-3 max-w-md">
          {MODES.map(m => (
            <button
              key={m.value}
              onClick={() => changeMode(m.value)}
              className={`flex flex-col items-center gap-1.5 rounded-xl border-2 py-4 text-xs transition-all ${
                mode === m.value
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

      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Skin</h3>
          <p className="text-xs text-muted-foreground mt-1">Default uses shadows; Bordered adds visible card outlines.</p>
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
