import type { MetadataRoute } from 'next'
import { tenantSiteOrigin } from '@/lib/serverApi'

/**
 * Per-tenant robots.txt.
 *
 * The origin comes from the request's Host, exactly as sitemap.ts already does.
 * It used to be `NEXT_PUBLIC_SITE_URL || 'https://churchnepal.com'` — one fixed
 * value shared by every church on the deployment — so a crawler on
 * gracechurchkathmandu.churchnepal.com was told the sitemap lived at
 * churchnepal.com/sitemap.xml, which is the marketing site and lists none of
 * that church's pages. In development it pointed at localhost:3000, a port
 * nothing runs on.
 *
 * The effect: the tenant-aware sitemap next door correctly enumerates every
 * sermon, event and blog post for the requesting church, and was advertised at
 * an address that does not describe that church. Discovery of every detail page
 * depended on the one line pointing the wrong way.
 *
 * Reading headers makes this route dynamic. That is required for correctness
 * and is cheap — robots.txt is a few hundred bytes.
 */
export default async function robots(): Promise<MetadataRoute.Robots> {
  const origin = await tenantSiteOrigin()

  // Answer engines are the traffic that matters for a church now: people ask
  // an assistant "what time is the service near me" far more than they browse.
  // `*` already permits these, but naming them is deliberate — it states the
  // intent, and it means a future blanket Disallow added for scrapers cannot
  // silently take the church out of AI answers as a side effect.
  const answerEngines = [
    'GPTBot', 'OAI-SearchBot', 'ChatGPT-User', // OpenAI
    'ClaudeBot', 'Claude-User', 'anthropic-ai', // Anthropic
    'PerplexityBot', 'Perplexity-User',
    'Google-Extended', // Gemini / AI Overviews grounding
    'Applebot-Extended',
    'cohere-ai', 'meta-externalagent', 'Bingbot',
  ]

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // /admin is the church's own console and /api is the proxy layer.
        // Neither is content, and both would waste crawl budget.
        disallow: ['/admin/', '/api/'],
      },
      {
        userAgent: answerEngines,
        allow: '/',
        disallow: ['/admin/', '/api/'],
      },
    ],
    sitemap: `${origin}/sitemap.xml`,
    host: origin,
  }
}
