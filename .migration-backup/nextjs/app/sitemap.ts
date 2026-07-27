import type { MetadataRoute } from 'next'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://churchnepal.com'

// Static public routes — always included.
const STATIC_ROUTES = [
  '/',
  '/about',
  '/visit',
  '/ministries',
  '/sermons',
  '/events',
  '/gallery',
  '/give',
  '/prayer',
  '/contact',
  '/live',
  '/leadership',
  '/pastor',
  '/privacy',
  '/terms',
  '/groups',
  '/membership',
  '/volunteer',
]

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date().toISOString()

  // Static pages
  const entries: MetadataRoute.Sitemap = STATIC_ROUTES.map((path) => ({
    url: `${BASE_URL}${path}`,
    lastModified: now,
    changeFrequency: path === '/' ? 'daily' : 'weekly',
    priority: path === '/' ? 1.0 : 0.8,
  }))

  // Dynamic pages would be fetched from the API in production.
  // For now we include the static routes which cover all public pages.
  return entries
}
