import type { MetadataRoute } from 'next'

const BASE_URL = import.meta.env.VITE_SITE_URL || 'https://churchnepal.com'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/api/'],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  }
}
