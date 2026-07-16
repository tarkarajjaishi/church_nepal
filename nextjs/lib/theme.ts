// Site-wide theme system for the church website.
//
// The public site's brand colors are all CSS variables (see tailwind.config.ts +
// globals.css), so changing them at runtime recolors the entire site live. The
// admin Theme Customizer writes the chosen values to the Rust backend (settings
// key/value store) so they apply for every visitor; SiteThemeApplier reads them
// on load. Dark / light / system mode is handled per-visitor by next-themes.

export const THEME_SETTING_KEYS = {
  primary: 'theme_primary',
  mode: 'theme_default_mode',
  skin: 'theme_skin',
} as const

export type ThemeMode = 'light' | 'dark' | 'system'
export type ThemeSkin = 'default' | 'bordered'

export const DEFAULT_PRIMARY = '#0b3c5d'
export const DEFAULT_MODE: ThemeMode = 'system'
export const DEFAULT_SKIN: ThemeSkin = 'default'

export interface ThemePreset {
  name: string
  label: string
  primary: string
}

// Curated brand palettes the admin can one-click apply.
export const THEME_PRESETS: ThemePreset[] = [
  { name: 'church-blue', label: 'Church Blue', primary: '#0b3c5d' },
  { name: 'ocean', label: 'Ocean Teal', primary: '#0d9394' },
  { name: 'royal', label: 'Royal Purple', primary: '#6d28d9' },
  { name: 'emerald', label: 'Emerald', primary: '#047857' },
  { name: 'crimson', label: 'Crimson', primary: '#be123c' },
  { name: 'sunset', label: 'Sunset', primary: '#ea580c' },
]

// ---- colour helpers -------------------------------------------------------

function normalizeHex(hex: string): string {
  let h = hex.trim().replace(/^#/, '')
  if (h.length === 3) h = h.split('').map(c => c + c).join('')
  return '#' + h.toLowerCase()
}

export function isValidHex(hex: string): boolean {
  return /^#?([a-f\d]{3}|[a-f\d]{6})$/i.test(hex.trim())
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(normalizeHex(hex))
  if (!m) return null
  return { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) }
}

const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)))

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => clamp(x).toString(16).padStart(2, '0')).join('')
}

// Mix a colour toward white by `amount` (0..1).
function lighten(hex: string, amount: number): string {
  const c = hexToRgb(hex)
  if (!c) return hex
  return rgbToHex(
    c.r + (255 - c.r) * amount,
    c.g + (255 - c.g) * amount,
    c.b + (255 - c.b) * amount,
  )
}

// Readable foreground (near-black or white) for text on top of `hex`.
function contrastFg(hex: string): string {
  const c = hexToRgb(hex)
  if (!c) return '#ffffff'
  const luminance = (0.299 * c.r + 0.587 * c.g + 0.114 * c.b) / 255
  return luminance > 0.62 ? '#1f2937' : '#ffffff'
}

// ---- runtime application --------------------------------------------------

const STYLE_EL_ID = 'site-theme-vars'

// Build the CSS that overrides the brand variables for a chosen primary colour.
// Light mode: use the colour as-is (and drive shadcn --primary too). Dark mode:
// lighten it so `text-church-blue` headings stay readable on dark backgrounds.
export function buildThemeCss(primary: string): string {
  const p = normalizeHex(primary)
  const rgb = hexToRgb(p) || { r: 11, g: 60, b: 93 }
  const sky = lighten(p, 0.18)
  const fg = contrastFg(p)
  const darkPrimary = lighten(p, 0.34)
  const darkSky = lighten(p, 0.46)
  const triplet = `${rgb.r}, ${rgb.g}, ${rgb.b}`
  return [
    `:root{--church-blue:${p};--church-blue-rgb:${triplet};--sky-blue:${sky};--ring:${p};}`,
    `:root:not(.dark){--primary:${p};--primary-foreground:${fg};}`,
    `.dark{--church-blue:${darkPrimary};--sky-blue:${darkSky};--ring:${darkPrimary};}`,
  ].join('\n')
}

export function applyPrimaryColor(primary: string): void {
  if (typeof document === 'undefined' || !isValidHex(primary)) return
  let el = document.getElementById(STYLE_EL_ID) as HTMLStyleElement | null
  if (!el) {
    el = document.createElement('style')
    el.id = STYLE_EL_ID
    document.head.appendChild(el)
  }
  el.textContent = buildThemeCss(primary)
}

export function applySkin(skin: string): void {
  if (typeof document === 'undefined') return
  document.documentElement.classList.toggle('skin-bordered', skin === 'bordered')
}
