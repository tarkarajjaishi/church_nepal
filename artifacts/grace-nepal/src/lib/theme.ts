// Site-wide theme system for the church website.
//
// The public site's brand colors are all CSS variables (see tailwind.config.ts +
// globals.css), so changing them at runtime recolors the entire site live. The
// admin Theme Customizer writes the chosen values to the Rust backend (settings
// key/value store) so they apply for every visitor; SiteThemeApplier reads them
// on load. Dark / light / system mode is handled per-visitor by next-themes.

export const THEME_SETTING_KEYS = {
  primary: 'theme_primary',
  accent: 'theme_accent',
  mode: 'theme_default_mode',
  skin: 'theme_skin',
  theme_preset: 'theme_preset',
  heading_font: 'theme_heading_font',
  body_font: 'theme_body_font',
  homepage_layout: 'homepage_layout',
  radius: 'theme_radius',
  logo: 'theme_logo',
} as const

export type ThemeMode = 'light' | 'dark' | 'system'
export type ThemeSkin = 'default' | 'bordered'

export const DEFAULT_PRIMARY   = '#0b3c5d'
export const DEFAULT_ACCENT    = '#d4a017'
export const DEFAULT_MODE: ThemeMode = 'system'
export const DEFAULT_SKIN: ThemeSkin = 'default'
export const DEFAULT_HEADING_FONT = "'Playfair Display', serif"
export const DEFAULT_BODY_FONT    = "'Inter', sans-serif"
export const DEFAULT_RADIUS    = '0.875rem'
export const DEFAULT_LOGO      = ''
export const THEME_DRAFT_KEY   = 'theme_draft'

export interface ThemePreset {
  name:          string
  label:         string
  description:   string
  primary:       string
  accent:        string      // secondary highlight color (was hard-coded gold)
  headingFont:   string
  bodyFont:      string
  layout:        string
  headingWeight: number
  radius:        string
}

// ── 5 curated church-specific presets ────────────────────────────────────────
// Each preset delivers a fully distinct visual identity by combining a primary
// color, accent color, Google Font pairing, corner radius, and homepage layout.
export const THEME_PRESETS: ThemePreset[] = [
  {
    name:          'grace-nepal',
    label:         'Grace Nepal',
    description:   'Official brand — deep navy, gold accents, Playfair headings. Timeless and trustworthy.',
    primary:       '#0b3c5d',
    accent:        '#d4a017',
    headingFont:   "'Playfair Display', serif",
    bodyFont:      "'Inter', sans-serif",
    layout:        'default',
    headingWeight: 700,
    radius:        '0.875rem',
  },
  {
    name:          'himalayan-dawn',
    label:         'Himalayan Dawn',
    description:   'Nepal-inspired teal with terracotta sunrise — warm, earthy, and rooted in community.',
    primary:       '#1e3a5f',
    accent:        '#e07b54',
    headingFont:   "'Lora', serif",
    bodyFont:      "'Source Sans 3', sans-serif",
    layout:        'split',
    headingWeight: 600,
    radius:        '0.5rem',
  },
  {
    name:          'revival-fire',
    label:         'Revival Fire',
    description:   'Deep crimson and amber gold — bold, Spirit-led energy for high-impact worship.',
    primary:       '#8b1a1a',
    accent:        '#f59e0b',
    headingFont:   "'Oswald', sans-serif",
    bodyFont:      "'Open Sans', sans-serif",
    layout:        'full-width',
    headingWeight: 700,
    radius:        '0.375rem',
  },
  {
    name:          'still-waters',
    label:         'Still Waters',
    description:   'Forest green and sage — serene, pastoral, inviting contemplation and rest.',
    primary:       '#1e4d3a',
    accent:        '#7ec8a0',
    headingFont:   "'Merriweather', serif",
    bodyFont:      "'Nunito', sans-serif",
    layout:        'centered',
    headingWeight: 700,
    radius:        '1rem',
  },
  {
    name:          'royal-priesthood',
    label:         'Royal Priesthood',
    description:   'Deep violet and bright gold — majestic, reverent, befitting a royal house of worship.',
    primary:       '#2e1065',
    accent:        '#fbbf24',
    headingFont:   "'Cinzel', serif",
    bodyFont:      "'Raleway', sans-serif",
    layout:        'minimal-hero',
    headingWeight: 700,
    radius:        '0.25rem',
  },
]

// ── colour helpers ────────────────────────────────────────────────────────────

function normalizeHex(hex: string): string {
  let h = hex.trim().replace(/^#/, '')
  if (h.length === 3) h = h.split('').map(c => c + c).join('')
  return '#' + h.toLowerCase()
}

export function isValidHex(hex: string | undefined | null): boolean {
  if (!hex) return false
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
export function lighten(hex: string, amount: number): string {
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

// ── runtime application ───────────────────────────────────────────────────────

const STYLE_EL_ID = 'site-theme-vars'

// Build the CSS that overrides the brand variables for a chosen primary + accent.
export function buildThemeCss(primary: string, accent?: string): string {
  const p   = normalizeHex(primary)
  const rgb = hexToRgb(p) || { r: 11, g: 60, b: 93 }
  const sky = lighten(p, 0.18)
  const fg  = contrastFg(p)
  const darkPrimary = lighten(p, 0.34)
  const darkSky     = lighten(p, 0.46)
  const triplet = `${rgb.r}, ${rgb.g}, ${rgb.b}`

  const accentPart = accent
    ? `\n:root{--gold:${accent};--gold-rgb:${(hexToRgb(accent) || { r: 212, g: 160, b: 23 }).r},${(hexToRgb(accent) || { r: 212, g: 160, b: 23 }).g},${(hexToRgb(accent) || { r: 212, g: 160, b: 23 }).b};}`
    : ''

  return [
    `:root{--church-blue:${p};--church-blue-rgb:${triplet};--sky-blue:${sky};--ring:${p};}`,
    `:root:not(.dark){--primary:${p};--primary-foreground:${fg};}`,
    `.dark{--church-blue:${darkPrimary};--sky-blue:${darkSky};--ring:${darkPrimary};}`,
    accentPart,
  ].join('\n')
}

export function applyPrimaryColor(primary: string, accent?: string): void {
  if (typeof document === 'undefined' || !isValidHex(primary)) return
  let el = document.getElementById(STYLE_EL_ID) as HTMLStyleElement | null
  if (!el) {
    el = document.createElement('style')
    el.id = STYLE_EL_ID
    document.head.appendChild(el)
  }
  el.textContent = buildThemeCss(primary, accent)
}

export function applySkin(skin: string): void {
  if (typeof document === 'undefined') return
  document.documentElement.classList.toggle('skin-bordered', skin === 'bordered')
}

export function applyRadius(radius: string): void {
  if (typeof document === 'undefined') return
  document.documentElement.style.setProperty('--radius', radius)
}

export function applyLogo(logo: string): void {
  if (typeof document === 'undefined') return
  if (logo) document.documentElement.setAttribute('data-theme-logo', logo)
  else document.documentElement.removeAttribute('data-theme-logo')
}

// ── font helpers ──────────────────────────────────────────────────────────────

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
  applyPrimaryColor(preset.primary, preset.accent)
  applyFonts(preset.headingFont, preset.bodyFont)
  loadGoogleFont(preset.headingFont)
  loadGoogleFont(preset.bodyFont)
  if (preset.radius) applyRadius(preset.radius)
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-homepage-layout', preset.layout)
  }
}

export function findPresetByName(name: string): ThemePreset | undefined {
  return THEME_PRESETS.find(p => p.name === name)
}

export type ThemeDraft = Record<string, string>

export async function getThemeDraft(apiClient: any): Promise<ThemeDraft> {
  try {
    const { data } = await apiClient.get('/settings/theme/draft')
    return data || {}
  } catch {
    return {}
  }
}

export async function saveThemeDraft(apiClient: any, draft: ThemeDraft): Promise<void> {
  await apiClient.put('/settings/theme/draft', draft)
}

export async function publishTheme(apiClient: any, draft: ThemeDraft): Promise<ThemeDraft> {
  const { data } = await apiClient.post('/settings/theme/publish', draft)
  return data
}
