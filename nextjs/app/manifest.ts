import type { MetadataRoute } from 'next'

const DEFAULT_NAME = 'Grace Nepal Church'
const DEFAULT_SHORT = 'Grace'
const DEFAULT_DESC = 'Faith • Hope • Love in Nepal'
const DEFAULT_THEME = '#0b3c5d'
const DEFAULT_BG = '#ffffff'

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  let name = DEFAULT_NAME
  let shortName = DEFAULT_SHORT
  let desc = DEFAULT_DESC
  let themeColor = DEFAULT_THEME
  let bgColor = DEFAULT_BG

  try {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002'
    const res = await fetch(`${apiBase}/api/settings`, {
      headers: { Accept: 'application/json' },
      next: { revalidate: 300 },
    })

    if (res.ok) {
      const rows: Array<{ key: string; value: string }> = await res.json()
      const map = new Map(rows.map((r) => [r.key, r.value]))

      if (map.has('church_name')) name = map.get('church_name')!
      if (map.has('church_tagline')) desc = map.get('church_tagline')!
      if (map.has('theme_primary')) themeColor = map.get('theme_primary')!
      bgColor = themeColor
    }
  } catch {
    // keep defaults
  }

  return {
    name: `${name} — ${desc}`,
    short_name: shortName,
    description: desc,
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: bgColor,
    theme_color: themeColor,
    categories: ['religion', 'lifestyle'],
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
    ],
  }
}
