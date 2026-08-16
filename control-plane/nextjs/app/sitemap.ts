import { MetadataRoute } from 'next'
import {
  getChurches, allCities, allDistricts, allProvinces, citySlug, slugify,
} from '@/lib/churches'
import { getAllBlogPosts, getCategories, getTags, termSlug } from '@/lib/blog-data'
import { getAllHelpArticles } from '@/lib/help-data'

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
  ['/ne/churches', 'daily', 0.8],
  ['/features', 'weekly', 0.8],
  ['/pricing', 'monthly', 0.8],
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

  const page = (path: string, priority: number) => ({
    url: `${BASE_URL}${path}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority,
  })

  const cities = allCities(churches)
  const placePages = [
    // Nepali city pages are listed as their own URLs, not as alternates of the
    // English ones — Google needs to crawl both before it will honour hreflang.
    ...cities.flatMap((c) => [
      page(`/churches/${citySlug(c)}`, 0.7),
      page(`/ne/churches/${citySlug(c)}`, 0.6),
    ]),
    ...allDistricts(churches).map((d) => page(`/churches/district/${slugify(d)}`, 0.6)),
    ...allProvinces(churches).map((p) => page(`/churches/province/${slugify(p)}`, 0.6)),
  ]

  // The profile pages are on our domain, so they are the ones a crawler can
  // actually attribute to this site; the subdomains are listed too but they
  // are separate sites.
  const profiles = churches.map((c) => page(`/churches/church/${c.slug}`, 0.7))

  const churchSites = churches.map((c) => ({
    url: `https://${c.subdomain}/`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }))

  // Blog posts and help articles were reachable only by clicking through the
  // index, so nothing below /blog and /help was ever submitted for indexing.
  const posts = getAllBlogPosts().map((post) => ({
    url: `${BASE_URL}/blog/${post.slug}`,
    lastModified: new Date(post.date),
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }))
  const taxonomies = [
    ...getCategories().map((c) => page(`/blog/category/${termSlug(c)}`, 0.4)),
    ...getTags().map((t) => page(`/blog/tag/${termSlug(t)}`, 0.3)),
  ]
  const helpArticles = getAllHelpArticles().map((a) => page(`/help/${a.slug}`, 0.5))

  return [...placePages, ...profiles, ...posts, ...taxonomies, ...helpArticles, ...churchSites]
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
