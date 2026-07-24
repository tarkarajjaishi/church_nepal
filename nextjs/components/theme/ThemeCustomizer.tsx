'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useTheme } from 'next-themes'
import { Settings2, X, RotateCcw, Sun, Moon, Monitor, Check, Palette, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { useIsAdmin } from '@/lib/useIsAdmin'
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
   applyLogo,
   loadGoogleFont,
   findPresetByName,
   isValidHex,
   saveThemeDraft,
   publishTheme,
   type ThemePreset,
   type ThemeSkin,
 } from '@/lib/theme'

const MODES = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
] as const

const RADIUS_OPTIONS = [
  { value: '0rem', label: 'None' },
  { value: '0.375rem', label: 'Small' },
  { value: '0.5rem', label: 'Medium' },
  { value: '0.875rem', label: 'Default' },
  { value: '1rem', label: 'Large' },
  { value: '1.5rem', label: 'XL' },
  { value: '2rem', label: '2XL' },
] as const

export function ThemeCustomizer() {
  const { isAdmin } = useIsAdmin()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [open, setOpen] = useState(false)
  const [primary, setPrimary] = useState<string>(DEFAULT_PRIMARY)
  const [skin, setSkin] = useState<ThemeSkin>(DEFAULT_SKIN)
  const [radius, setRadius] = useState<string>(DEFAULT_RADIUS)
const [headingFont, setHeadingFont] = useState<string>(DEFAULT_HEADING_FONT)
   const [bodyFont, setBodyFont] = useState<string>(DEFAULT_BODY_FONT)
   const [logo, setLogo] = useState<string>(DEFAULT_LOGO)
   const [activePreset, setActivePreset] = useState<string | null>(null)
  const [savingKey, setSavingKey] = useState<string | null>(null)
  const [draftExists, setDraftExists] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [published, setPublished] = useState(false)
  const saveTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  useEffect(() => setMounted(true), [])

  useEffect(() => {
    if (!isAdmin) return
    api
      .get('/settings')
      .then(({ data }) => {
        if (!Array.isArray(data)) return
        const pubMap = new Map<string, string>(data.map((r: any) => [r.key, r.value]))

        api.get('/settings/theme/draft').then(({ data: draftData }) => {
          const draftExists_ = draftData && Object.keys(draftData).length > 0
          setDraftExists(draftExists_)
          const draftEntries = draftExists_ ? Object.entries(draftData) : []
          const merged = new Map([...pubMap, ...draftEntries])

          const p = merged.get(THEME_SETTING_KEYS.primary)
          if (p && isValidHex(p)) setPrimary(p)
          const s = merged.get(THEME_SETTING_KEYS.skin)
          if (s === 'bordered' || s === 'default') setSkin(s)
          const r = merged.get(THEME_SETTING_KEYS.radius)
          if (r) setRadius(r)
          const hFont = merged.get(THEME_SETTING_KEYS.heading_font)
          if (hFont) setHeadingFont(hFont)
          const bFont = merged.get(THEME_SETTING_KEYS.body_font)
          if (bFont) setBodyFont(bFont)

          const logoVal = merged.get(THEME_SETTING_KEYS.logo)
          if (logoVal !== undefined) setLogo(logoVal)

          const presetName = merged.get(THEME_SETTING_KEYS.theme_preset)
          if (presetName) {
            const preset = findPresetByName(presetName)
            if (preset) {
              setActivePreset(preset.name)
              applyPreset(preset)
            }
          } else {
            const hFont = merged.get(THEME_SETTING_KEYS.heading_font)
            const bFont = merged.get(THEME_SETTING_KEYS.body_font)
            if (hFont && bFont) {
              applyFonts(hFont, bFont)
              loadGoogleFont(hFont)
              loadGoogleFont(bFont)
            }
          }
        }).catch(() => {
          const p = pubMap.get(THEME_SETTING_KEYS.primary)
          if (p && isValidHex(p)) setPrimary(p)
          const s = pubMap.get(THEME_SETTING_KEYS.skin)
          if (s === 'bordered' || s === 'default') setSkin(s)
          const l = pubMap.get(THEME_SETTING_KEYS.logo)
          if (l !== undefined) setLogo(l)
        })
      })
      .catch(() => {})
  }, [isAdmin])

const getCurrentDraft = useCallback(() => {
     return {
       [THEME_SETTING_KEYS.primary]: primary,
       [THEME_SETTING_KEYS.skin]: skin,
       [THEME_SETTING_KEYS.mode]: theme || 'system',
       [THEME_SETTING_KEYS.heading_font]: headingFont,
       [THEME_SETTING_KEYS.body_font]: bodyFont,
       [THEME_SETTING_KEYS.theme_preset]: activePreset || '',
       [THEME_SETTING_KEYS.homepage_layout]: activePreset ? findPresetByName(activePreset)?.layout || '' : '',
       [THEME_SETTING_KEYS.radius]: radius,
       [THEME_SETTING_KEYS.logo]: logo,
     }
   }, [primary, skin, theme, headingFont, bodyFont, activePreset, radius, logo])

  const saveDraft = useCallback((draft: Record<string, string>) => {
    if (saveTimers.current._draft) clearTimeout(saveTimers.current._draft)
    saveTimers.current._draft = setTimeout(() => {
      saveThemeDraft(api, draft).then(() => setDraftExists(true)).catch(() => {})
    }, 400)
  }, [])

  const changePrimary = (hex: string) => {
    setPrimary(hex)
    setActivePreset(null)
    if (isValidHex(hex)) {
      applyPrimaryColor(hex)
    }
    saveDraft({
      ...getCurrentDraft(),
      [THEME_SETTING_KEYS.primary]: hex,
      [THEME_SETTING_KEYS.theme_preset]: '',
    })
  }

  const changeSkin = (s: ThemeSkin) => {
    setSkin(s)
    applySkin(s)
    const draft = getCurrentDraft()
    draft[THEME_SETTING_KEYS.skin] = s
    saveDraft(draft)
  }

  const changeMode = (m: string) => {
    setTheme(m)
    const draft = getCurrentDraft()
    draft[THEME_SETTING_KEYS.mode] = m
    saveDraft(draft)
  }

const changeRadius = (r: string) => {
     setRadius(r)
     applyRadius(r)
     const draft = getCurrentDraft()
     draft[THEME_SETTING_KEYS.radius] = r
     saveDraft(draft)
   }

   const changeLogo = (url: string) => {
     setLogo(url)
     applyLogo(url)
     const draft = getCurrentDraft()
     draft[THEME_SETTING_KEYS.logo] = url
     saveDraft(draft)
   }

  const selectPreset = (preset: ThemePreset) => {
    applyPreset(preset)
    setActivePreset(preset.name)
    setPrimary(preset.primary)
    setHeadingFont(preset.headingFont)
    setBodyFont(preset.bodyFont)
    loadGoogleFont(preset.headingFont)
    loadGoogleFont(preset.bodyFont)
    const draft = getCurrentDraft()
    draft[THEME_SETTING_KEYS.primary] = preset.primary
    draft[THEME_SETTING_KEYS.heading_font] = preset.headingFont
    draft[THEME_SETTING_KEYS.body_font] = preset.bodyFont
    draft[THEME_SETTING_KEYS.theme_preset] = preset.name
    draft[THEME_SETTING_KEYS.homepage_layout] = preset.layout
    saveDraft(draft)
  }

  const clearPreset = () => {
    setActivePreset(null)
    const draft = getCurrentDraft()
    draft[THEME_SETTING_KEYS.theme_preset] = ''
    draft[THEME_SETTING_KEYS.homepage_layout] = ''
    saveDraft(draft)
  }

  const reset = async () => {
    setPrimary(DEFAULT_PRIMARY)
    setSkin(DEFAULT_SKIN)
    setRadius(DEFAULT_RADIUS)
    setHeadingFont(DEFAULT_HEADING_FONT)
    setBodyFont(DEFAULT_BODY_FONT)
    setLogo(DEFAULT_LOGO)
    setActivePreset(null)
    applyPrimaryColor(DEFAULT_PRIMARY)
    applySkin(DEFAULT_SKIN)
    applyFonts(DEFAULT_HEADING_FONT, DEFAULT_BODY_FONT)
    applyRadius(DEFAULT_RADIUS)
    applyLogo(DEFAULT_LOGO)
    const draft: Record<string, string> = {
      [THEME_SETTING_KEYS.primary]: DEFAULT_PRIMARY,
      [THEME_SETTING_KEYS.skin]: DEFAULT_SKIN,
      [THEME_SETTING_KEYS.mode]: 'system',
      [THEME_SETTING_KEYS.heading_font]: DEFAULT_HEADING_FONT,
      [THEME_SETTING_KEYS.body_font]: DEFAULT_BODY_FONT,
      [THEME_SETTING_KEYS.theme_preset]: '',
      [THEME_SETTING_KEYS.homepage_layout]: 'default',
      [THEME_SETTING_KEYS.radius]: DEFAULT_RADIUS,
      [THEME_SETTING_KEYS.logo]: DEFAULT_LOGO,
    }
    saveDraft(draft).then(() => setDraftExists(true)).catch(() => {})
  }

  const handlePublish = async () => {
    const draft = getCurrentDraft()
    setPublishing(true)
    try {
      await publishTheme(api, draft)
      setPublished(true)
      setDraftExists(true)
      setTimeout(() => setPublished(false), 2000)
    } catch {}
    setPublishing(false)
  }

  useEffect(() => {
    const timers = saveTimers.current
    return () => {
      if (timers._draft) clearTimeout(timers._draft)
      Object.values(timers).forEach(clearTimeout)
    }
  }, [])

  if (!isAdmin) return null

  const activeMode = mounted ? theme : undefined
  const colorInputValue = isValidHex(primary) && primary.length >= 7 ? primary : DEFAULT_PRIMARY
  const swatchMatch = (hex: string) => primary.toLowerCase() === hex.toLowerCase()

  return (
    <>
      <button
        onClick={() => setOpen(o => !o)}
        aria-label="Open theme customizer"
        className="fixed right-0 top-1/3 z-[60] flex size-11 items-center justify-center rounded-l-xl bg-church-blue text-white shadow-lg transition-transform hover:scale-105"
      >
        <Settings2 className="size-5 motion-safe:animate-[spin_7s_linear_infinite]" />
      </button>

      <aside
        className={`fixed right-0 top-0 z-[70] flex h-full w-[340px] max-w-[88vw] flex-col border-l border-border bg-background shadow-2xl transition-transform duration-300 ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="min-w-0">
            <h3 className="flex items-center gap-2 font-semibold text-foreground">
              <Palette className="size-4 text-church-blue" /> Theme Customizer
            </h3>
            <p className="text-xs text-muted-foreground">
              {draftExists ? 'Draft · not published' : 'No draft yet'}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="size-8" onClick={reset} title="Reset to defaults">
              <RotateCcw className="size-4" />
            </Button>
            <Button variant="ghost" size="icon" className="size-8" onClick={() => setOpen(false)} title="Close">
              <X className="size-4" />
            </Button>
          </div>
        </div>

        <div className="flex-1 space-y-7 overflow-y-auto px-5 py-6">
          <section className="space-y-3">
            <Label className="text-sm font-medium">Theme Presets</Label>
            <div className="grid grid-cols-2 gap-2">
              {THEME_PRESETS.map(p => (
                <button
                  key={p.name}
                  onClick={() => selectPreset(p)}
                  className={`flex items-start gap-2.5 rounded-lg border p-3 text-left transition ${
                    activePreset === p.name
                      ? 'border-church-blue ring-2 ring-church-blue bg-church-blue/5'
                      : 'border-border hover:border-church-blue/40'
                  }`}
                >
                  <span
                    className="mt-0.5 size-5 shrink-0 rounded-full ring-1 ring-black/10"
                    style={{ backgroundColor: p.primary }}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-medium text-foreground truncate">{p.label}</span>
                      {activePreset === p.name && <Check className="size-3 shrink-0 text-church-blue" />}
                    </div>
                    <p className="text-[10px] text-muted-foreground truncate">{p.headingFont.split(',')[0].replace(/'/g, '')}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{p.bodyFont.split(',')[0].replace(/'/g, '')}</p>
                  </div>
                </button>
              ))}
              <button
                onClick={clearPreset}
                className={`flex items-start gap-2.5 rounded-lg border p-3 text-left transition ${
                  activePreset === null
                    ? 'border-church-blue ring-2 ring-church-blue bg-church-blue/5'
                    : 'border-border hover:border-church-blue/40'
                }`}
              >
                <span className="mt-0.5 size-5 shrink-0 rounded-full bg-gradient-to-br from-red-500 via-green-500 to-blue-500 ring-1 ring-black/10" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-medium text-foreground">Custom</span>
                    {activePreset === null && <Check className="size-3 shrink-0 text-church-blue" />}
                  </div>
                  <p className="text-[10px] text-muted-foreground">Manual controls</p>
                </div>
              </button>
            </div>
          </section>

          <Separator />

          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Primary Color</Label>
              {savingKey === THEME_SETTING_KEYS.primary && (
                <span className="text-[11px] text-muted-foreground">saving…</span>
              )}
            </div>
            <div className="grid grid-cols-6 gap-2">
              {THEME_PRESETS.map(p => (
                <button
                  key={p.name}
                  title={p.label}
                  onClick={() => {
                    setPrimary(p.primary)
                    setActivePreset(null)
                    changePrimary(p.primary)
                  }}
                  className={`relative flex size-9 items-center justify-center rounded-lg ring-offset-2 ring-offset-background transition ${
                    swatchMatch(p.primary)
                      ? 'ring-2 ring-church-blue'
                      : 'ring-1 ring-border hover:ring-church-blue/50'
                  }`}
                  style={{ backgroundColor: p.primary }}
                >
                  {swatchMatch(p.primary) && <Check className="size-4 text-white" />}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 rounded-lg border border-border p-2">
              <span className="relative size-8 shrink-0 overflow-hidden rounded-md border border-border">
                <span className="absolute inset-0" style={{ backgroundColor: colorInputValue }} />
                <input
                  type="color"
                  value={colorInputValue}
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
                className="w-full flex-1 bg-transparent font-mono text-sm outline-none text-foreground"
              />
            </div>
          </section>

          <Separator />

          <section className="space-y-3">
            <Label className="text-sm font-medium">Mode</Label>
            <div className="grid grid-cols-3 gap-2">
              {MODES.map(m => (
                <button
                  key={m.value}
                  onClick={() => changeMode(m.value)}
                  className={`flex flex-col items-center gap-1.5 rounded-lg border py-3 text-xs transition ${
                    activeMode === m.value
                      ? 'border-church-blue bg-church-blue/5 text-church-blue'
                      : 'border-border text-muted-foreground hover:border-church-blue/40'
                  }`}
                >
                  <m.icon className="size-5" />
                  {m.label}
                </button>
              ))}
            </div>
          </section>

          <Separator />

          <section className="space-y-3">
            <Label className="text-sm font-medium">Radius</Label>
            <div className="grid grid-cols-2 gap-2">
              {RADIUS_OPTIONS.map(r => (
                <button
                  key={r.value}
                  onClick={() => changeRadius(r.value)}
                  className={`rounded-lg border py-3 text-xs transition ${
                    radius === r.value
                      ? 'border-church-blue bg-church-blue/5 text-church-blue'
                      : 'border-border text-muted-foreground hover:border-church-blue/40'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </section>

          <Separator />

          <section className="space-y-3">
            <Label className="text-sm font-medium">Skin</Label>
            <div className="grid grid-cols-2 gap-2">
              {(['default', 'bordered'] as ThemeSkin[]).map(s => (
                <button
                  key={s}
                  onClick={() => changeSkin(s)}
                  className={`rounded-lg border py-3 text-xs capitalize transition ${
                    skin === s
                      ? 'border-church-blue bg-church-blue/5 text-church-blue'
                      : 'border-border text-muted-foreground hover:border-church-blue/40'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </section>
        </div>

        <div className="border-t border-border px-5 py-4">
          {published && (
            <span className="flex items-center gap-1.5 text-sm text-green-600 mb-2">
              <Check className="size-4" /> Published
            </span>
          )}
          <Button
            className="w-full"
            onClick={handlePublish}
            disabled={publishing || !draftExists}
          >
            {publishing && <Loader2 className="size-4 mr-2 animate-spin" />}
            Publish to live site
          </Button>
        </div>
      </aside>
    </>
  )
}
