import { MetadataRoute } from 'next'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://churchnepal.com'
const API = process.env.NEXT_PUBLIC_CONTROL_API || '/api'

/**
 * The sitemap listed 5 URLs while the site had roughly twenty public pages, so
 * most of it was invisible to a crawler that did not stumble across an internal
 * link. Every real public route is here now, plus one entry per church so the
 * directory's members are discoverable rather than buried behind client-side
 * rendering.
 */
const STATIC_ROUTES: Array<[string, MetadataRoute.Sitemap[number]['changeFrequency'], number]> = [
  ['', 'daily', 1.0],
  ['/churches', 'daily', 0.9],
  ['/features', 'weekly', 0.8],
  ['/pricing', 'monthly', 0.8],
  ['/how-it-works', 'monthly', 0.7],
  ['/about', 'monthly', 0.7],
  ['/blog', 'weekly', 0.7],
  ['/contact', 'monthly', 0.6],
  ['/faq', 'monthly', 0.6],
  ['/docs', 'monthly', 0.5],
  ['/help', 'monthly', 0.5],
  ['/customers', 'monthly', 0.5],
  ['/templates', 'monthly', 0.5],
  ['/compare', 'monthly', 0.5],
  ['/migrate', 'monthly', 0.4],
  ['/resources', 'monthly', 0.4],
  ['/roadmap', 'monthly', 0.4],
  ['/changelog', 'weekly', 0.4],
  ['/security', 'yearly', 0.3],
  ['/trust', 'yearly', 0.3],
  ['/status', 'daily', 0.3],
  ['/privacy', 'yearly', 0.2],
  ['/terms', 'yearly', 0.2],
  ['/accessibility', 'yearly', 0.2],
]

async function churchUrls(): Promise<MetadataRoute.Sitemap> {
  try {
    const base = API.startsWith('http') ? API : 'http://control-api:3100/api'
    const res = await fetch(`${base}/public/churches`, { next: { revalidate: 3600 } })
    if (!res.ok) return []
    const churches: Array<{ subdomain: string }> = await res.json()
    return churches.map((c) => ({
      url: `https://${c.subdomain}/`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    }))
  } catch {
    // A sitemap missing the churches is better than a 500 that costs the whole file.
    return []
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()
  return [
    ...STATIC_ROUTES.map(([path, changeFrequency, priority]) => ({
      url: `${BASE_URL}${path || '/'}`,
      lastModified: now,
      changeFrequency,
      priority,
    })),
    ...(await churchUrls()),
  ]
}
