import type { MetadataRoute } from 'next'
import { fetchTenant, tenantSiteOrigin } from '@/lib/serverApi'

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
  '/blog',
  '/testimonies',
]

type HasId = { id: string | number }

/**
 * Per-tenant sitemap.
 *
 * Two things this now does that it did not before:
 *
 * 1. Detail pages are included. Previously only the static list pages were
 *    listed, so no individual sermon, event, ministry or blog post was
 *    discoverable — the majority of the site's actual content.
 * 2. URLs are built from the request's Host, not a fixed NEXT_PUBLIC_SITE_URL.
 *    On a multi-tenant deployment every church shares this one file, so a
 *    hardcoded origin would have advertised one church's domain in every
 *    church's sitemap.
 *
 * Reading headers makes this dynamic, which is unavoidable for the above and
 * fine for a sitemap. Each collection degrades independently: if the API is
 * unavailable the static routes are still emitted rather than the whole
 * sitemap failing.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = await tenantSiteOrigin()
  const now = new Date().toISOString()

  const entries: MetadataRoute.Sitemap = STATIC_ROUTES.map((path) => ({
    url: `${base}${path}`,
    lastModified: now,
    changeFrequency: path === '/' ? 'daily' : 'weekly',
    priority: path === '/' ? 1.0 : 0.8,
  }))

  // Blog is deliberately absent: the blog list links to /blog/{slug} but no
  // such route exists, so those URLs 404. Listing them here would just feed
  // crawlers dead links. Add the route first, then add it here.
  const collections: { path: string; prefix: string }[] = [
    { path: '/api/sermons', prefix: '/sermons' },
    { path: '/api/events', prefix: '/events' },
    { path: '/api/ministries', prefix: '/ministries' },
  ]

  const results = await Promise.all(
    collections.map(async ({ path, prefix }) => {
      const items = await fetchTenant<HasId[]>(path)
      if (!Array.isArray(items)) return []
      return items
        .filter((item) => item?.id != null)
        .map((item) => ({
          url: `${base}${prefix}/${item.id}`,
          lastModified: now,
          changeFrequency: 'monthly' as const,
          priority: 0.6,
        }))
    })
  )

  return [...entries, ...results.flat()]
}
