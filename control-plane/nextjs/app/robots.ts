import { MetadataRoute } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://churchnepal.com';

/**
 * AI answer engines are named explicitly rather than left to the `*` rule.
 *
 * Several of them (Google-Extended, Applebot-Extended) only control model
 * training and are ignored for search indexing, but naming them makes the
 * intent auditable — and a future "block AI" change then has one obvious place
 * to happen instead of being an accident of a wildcard.
 *
 * /admin and /api stay disallowed: the console is not content, and the API
 * would otherwise burn crawl budget on JSON that duplicates the pages.
 */
export default function robots(): MetadataRoute.Robots {
  const allowAll = { allow: '/', disallow: ['/admin', '/api'] };

  return {
    rules: [
      { userAgent: '*', ...allowAll },
      // Search
      { userAgent: 'Googlebot', ...allowAll },
      { userAgent: 'Bingbot', ...allowAll },
      // Answer engines
      { userAgent: 'GPTBot', ...allowAll },
      { userAgent: 'OAI-SearchBot', ...allowAll },
      { userAgent: 'ChatGPT-User', ...allowAll },
      { userAgent: 'ClaudeBot', ...allowAll },
      { userAgent: 'Claude-Web', ...allowAll },
      { userAgent: 'PerplexityBot', ...allowAll },
      { userAgent: 'Google-Extended', ...allowAll },
      { userAgent: 'Applebot', ...allowAll },
      { userAgent: 'Applebot-Extended', ...allowAll },
      { userAgent: 'CCBot', ...allowAll },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
