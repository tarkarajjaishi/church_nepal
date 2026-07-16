'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useTheme } from 'next-themes'
import { Settings2, X, RotateCcw, Sun, Moon, Monitor, Check, Palette } from 'lucide-react'
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
  applyPrimaryColor,
  applySkin,
  isValidHex,
  type ThemeSkin,
} from '@/lib/theme'

const MODES = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
] as const

/**
 * Admin-only floating Theme Customizer. Visible only to logged-in admins
 * (useIsAdmin). Changing the primary colour, mode, or skin applies instantly
 * and is saved to the backend settings store so it becomes the site-wide
 * default for every visitor.
 */
export function ThemeCustomizer() {
  const { isAdmin } = useIsAdmin()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [open, setOpen] = useState(false)
  const [primary, setPrimary] = useState<string>(DEFAULT_PRIMARY)
  const [skin, setSkin] = useState<ThemeSkin>(DEFAULT_SKIN)
  const [savingKey, setSavingKey] = useState<string | null>(null)
  const saveTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  useEffect(() => setMounted(true), [])

  // Load the current site-wide theme so the panel reflects reality.
  useEffect(() => {
    if (!isAdmin) return
    api
      .get('/settings')
      .then(({ data }) => {
        if (!Array.isArray(data)) return
        const map = new Map<string, string>(data.map((r: any) => [r.key, r.value]))
        const p = map.get(THEME_SETTING_KEYS.primary)
        if (p && isValidHex(p)) setPrimary(p)
        const s = map.get(THEME_SETTING_KEYS.skin)
        if (s === 'bordered' || s === 'default') setSkin(s)
      })
      .catch(() => {})
  }, [isAdmin])

  const saveSetting = useCallback((key: string, value: string) => {
    if (saveTimers.current[key]) clearTimeout(saveTimers.current[key])
    setSavingKey(key)
    saveTimers.current[key] = setTimeout(() => {
      api
        .put(`/settings/${key}`, { value })
        .catch(() => {})
        .finally(() => setSavingKey(prev => (prev === key ? null : prev)))
    }, 400)
  }, [])

  const changePrimary = (hex: string) => {
    setPrimary(hex)
    if (isValidHex(hex)) {
      applyPrimaryColor(hex)
      saveSetting(THEME_SETTING_KEYS.primary, hex)
    }
  }
  const changeSkin = (s: ThemeSkin) => {
    setSkin(s)
    applySkin(s)
    saveSetting(THEME_SETTING_KEYS.skin, s)
  }
  const changeMode = (m: string) => {
    setTheme(m)
    saveSetting(THEME_SETTING_KEYS.mode, m)
  }
  const reset = () => {
    changePrimary(DEFAULT_PRIMARY)
    changeSkin(DEFAULT_SKIN)
    changeMode('system')
  }

  // Clean up pending debounced saves on unmount.
  useEffect(() => {
    const timers = saveTimers.current
    return () => Object.values(timers).forEach(clearTimeout)
  }, [])

  if (!isAdmin) return null

  const activeMode = mounted ? theme : undefined
  const colorInputValue = isValidHex(primary) && primary.length >= 7 ? primary : DEFAULT_PRIMARY
  const swatchMatch = (hex: string) => primary.toLowerCase() === hex.toLowerCase()

  return (
    <>
      {/* Toggler tab */}
      <button
        onClick={() => setOpen(o => !o)}
        aria-label="Open theme customizer"
        className="fixed right-0 top-1/3 z-[60] flex size-11 items-center justify-center rounded-l-xl bg-church-blue text-white shadow-lg transition-transform hover:scale-105"
      >
        <Settings2 className="size-5 motion-safe:animate-[spin_7s_linear_infinite]" />
      </button>

      {/* No backdrop — the page stays fully visible and interactive so the
          master colour change can be previewed live across the whole system. */}

      {/* Panel */}
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
            <p className="text-xs text-muted-foreground">Site-wide · applies to all visitors</p>
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
          {/* Primary colour */}
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
                  onClick={() => changePrimary(p.primary)}
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

            {/* Custom hex */}
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

          {/* Mode */}
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

          {/* Skin */}
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
      </aside>
    </>
  )
}
