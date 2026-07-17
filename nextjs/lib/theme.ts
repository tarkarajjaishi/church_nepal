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
  theme_preset: 'theme_preset',
  heading_font: 'theme_heading_font',
  body_font: 'theme_body_font',
  homepage_layout: 'homepage_layout',
} as const

export type ThemeMode = 'light' | 'dark' | 'system'
export type ThemeSkin = 'default' | 'bordered'

export const DEFAULT_PRIMARY = '#0b3c5d'
export const DEFAULT_MODE: ThemeMode = 'system'
export const DEFAULT_SKIN: ThemeSkin = 'default'
export const DEFAULT_HEADING_FONT = "'Poppins', sans-serif"
export const DEFAULT_BODY_FONT = "'Inter', sans-serif"

export interface ThemePreset {
  name: string
  label: string
  primary: string
  headingFont: string
  bodyFont: string
  layout: string
  headingWeight: number
  description: string
}

// Six curated brand presets — the admin can one-click apply any of these.
// Each preset bundles a distinct color palette, Google Font pairing, and
// homepage layout variant for an instantly different site feel.
export const THEME_PRESETS: ThemePreset[] = [
  {
    name: 'classic-church',
    label: 'Classic Church',
    primary: '#0b3c5d',
    headingFont: "'Playfair Display', serif",
    bodyFont: "'Inter', sans-serif",
    layout: 'default',
    headingWeight: 700,
    description: 'Traditional navy palette with elegant serif headings',
  },
  {
    name: 'modern-minimal',
    label: 'Modern Minimal',
    primary: '#1a1a2e',
    headingFont: "'Montserrat', sans-serif",
    bodyFont: "'Open Sans', sans-serif",
    layout: 'magazine',
    headingWeight: 600,
    description: 'Clean lines, minimal palette, magazine-style layout',
  },
  {
    name: 'bold-gospel',
    label: 'Bold Gospel',
    primary: '#be123c',
    headingFont: "'Oswald', sans-serif",
    bodyFont: "'Source Sans 3', sans-serif",
    layout: 'full-width',
    headingWeight: 700,
    description: 'High-impact red with bold typography, full-width sections',
  },
  {
    name: 'warm-fellowship',
    label: 'Warm Fellowship',
    primary: '#b45309',
    headingFont: "'Nunito', sans-serif",
    bodyFont: "'Nunito Sans', sans-serif",
    layout: 'centered',
    headingWeight: 700,
    description: 'Warm amber tones, friendly rounded fonts, centered layout',
  },
  {
    name: 'elegant-worship',
    label: 'Elegant Worship',
    primary: '#6d28d9',
    headingFont: "'Cormorant Garamond', serif",
    bodyFont: "'Lora', serif",
    layout: 'minimal-hero',
    headingWeight: 700,
    description: 'Regal purple with refined serifs, spacious minimal hero',
  },
  {
    name: 'vibrant-youth',
    label: 'Vibrant Youth',
    primary: '#059669',
    headingFont: "'Poppins', sans-serif",
    bodyFont: "'Inter', sans-serif",
    layout: 'split',
    headingWeight: 700,
    description: 'Fresh green energy with split-column dynamic layout',
  },
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

// ---- font helpers --------------------------------------------------------

const FONT_STYLE_EL_ID = 'site-theme-fonts'
const loadedFonts = new Set<string>()

export function applyFonts(heading: string, body: string): void {
  if (typeof document === 'undefined') return
  let el = document.getElementById(FONT_STYLE_EL_ID) as HTMLStyleElement | null
  if (!el) {
    el = document.createElement('style')
    el.id = FONT_STYLE_EL_ID
    document.head.appendChild(el)
  }
  el.textContent = `:root{--font-heading:${heading};--font-body:${body};}`
}

export function loadGoogleFont(fontFamily: string): void {
  if (typeof document === 'undefined') return
  // Skip fonts already bundled in the project
  const name = fontFamily.split(',')[0].trim().replace(/['"]/g, '')
  if (!name || name === 'Inter' || name === 'Poppins') return
  if (loadedFonts.has(name)) return
  loadedFonts.add(name)
  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(name)}:wght@400;600;700;800&display=swap`
  document.head.appendChild(link)
}

export function applyPreset(preset: ThemePreset): void {
  applyPrimaryColor(preset.primary)
  applyFonts(preset.headingFont, preset.bodyFont)
  loadGoogleFont(preset.headingFont)
  loadGoogleFont(preset.bodyFont)
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-homepage-layout', preset.layout)
  }
}

export function findPresetByName(name: string): ThemePreset | undefined {
  return THEME_PRESETS.find(p => p.name === name)
}
