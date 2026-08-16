import { MetadataRoute } from 'next'
import { getChurches, allCities, citySlug } from '@/lib/churches'

// Same reason as the directory pages: built statically this would ship a
// sitemap with no churches and no city pages in it.
export const dynamic = 'force-dynamic'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://churchnepal.com'

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

async function dynamicUrls(): Promise<MetadataRoute.Sitemap> {
  // A sitemap missing these is better than a 500 that costs the whole file.
  const churches = await getChurches()
  const now = new Date()

  const cityPages = allCities(churches).map((c) => ({
    url: `${BASE_URL}/churches/${citySlug(c)}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  const churchSites = churches.map((c) => ({
    url: `https://${c.subdomain}/`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }))

  return [...cityPages, ...churchSites]
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
    ...(await dynamicUrls()),
  ]
}
