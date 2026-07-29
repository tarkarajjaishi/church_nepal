const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://churchnepal.com'

/**
 * schema.org/Church structured data.
 *
 * Ported from the old client-side Seo.tsx, which injected this via
 * document.createElement in an effect — so it only existed after hydration and
 * most crawlers never saw it. Rendering it server-side puts it in the initial
 * HTML where it actually counts.
 */
export function StructuredData() {
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'Church',
    name: 'Grace Nepal Church',
    description:
      'A Christ-centred community in Kathmandu, Nepal — worshipping Jesus, growing in faith, and serving every village with the gospel.',
    url: SITE_URL,
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Kathmandu',
      addressCountry: 'NP',
    },
  }

  return (
    <script
      type="application/ld+json"
      // Serialised server-side from a literal above — no user input reaches it.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }}
    />
  )
}
