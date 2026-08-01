import { fetchTenant, tenantSiteOrigin } from '@/lib/serverApi'

interface ContentBlock {
  sectionKey?: string
  section_key?: string
  title?: string | null
  subtitle?: string | null
  body?: string | null
}

interface ContactInfo {
  address?: string | null
  city?: string | null
  country?: string | null
  phone?: string | null
  email?: string | null
}

/**
 * schema.org/Church structured data, per tenant.
 *
 * This was a hardcoded literal — every church on the deployment published
 * `"name": "Grace Nepal Church"`, `"…in Kathmandu…"` and
 * `"url": "http://localhost:3000"`. Verified live: Hillside Church Pokhara's
 * homepage told crawlers it was Grace Nepal Church. Structured data is the
 * single thing AI search engines extract and cite, so every church was
 * broadcasting another church's identity to exactly the systems that quote it.
 *
 * Worse than being wrong once: it could never become right. A church renaming
 * itself in the admin changed the visible page but not the schema, because the
 * schema did not read the church's data at all.
 *
 * Now the name and strapline come from the `site_brand` content block — the
 * same source the visible header uses, so the two cannot disagree — and the URL
 * comes from the request Host like robots.ts and sitemap.ts.
 *
 * Fields are omitted when unknown rather than defaulted. An invented address is
 * worse than a missing one: search engines penalise inconsistent NAP data, and
 * an AI engine will happily cite a fabricated address as fact.
 */
export async function StructuredData() {
  const [origin, blocks, contact] = await Promise.all([
    tenantSiteOrigin(),
    fetchTenant<ContentBlock[] | { data: ContentBlock[] }>('/api/content-blocks/enabled'),
    fetchTenant<ContactInfo[] | { data: ContactInfo[] }>('/api/contact-info'),
  ])

  // Some list endpoints paginate and some do not — normalise before indexing.
  const asList = <T,>(v: T[] | { data: T[] } | null): T[] =>
    Array.isArray(v) ? v : Array.isArray(v?.data) ? v!.data : []

  const brand = asList(blocks).find(
    (b) => (b.sectionKey ?? b.section_key) === 'site_brand',
  )
  const info = asList(contact)[0]

  const name = brand?.title?.trim()
  // Without a name there is nothing worth asserting. Emitting a Church entity
  // with no identity would just add noise for a crawler to reconcile.
  if (!name) return null

  const address =
    info?.address || info?.city || info?.country
      ? {
          '@type': 'PostalAddress',
          ...(info?.address ? { streetAddress: info.address } : {}),
          ...(info?.city ? { addressLocality: info.city } : {}),
          ...(info?.country ? { addressCountry: info.country } : {}),
        }
      : undefined

  const ld = {
    '@context': 'https://schema.org',
    '@type': 'Church',
    name,
    ...(brand?.subtitle?.trim() ? { slogan: brand.subtitle.trim() } : {}),
    ...(brand?.body?.trim() ? { description: brand.body.trim() } : {}),
    url: origin,
    ...(address ? { address } : {}),
    ...(info?.phone ? { telephone: info.phone } : {}),
    ...(info?.email ? { email: info.email } : {}),
  }

  return (
    <script
      type="application/ld+json"
      // Values originate from this church's own CMS content. JSON.stringify
      // escapes the quotes and backslashes that would break out of the script
      // element; `<` is escaped below so a `</script>` in admin-entered copy
      // cannot terminate the block early.
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(ld).replace(/</g, '\\u003c'),
      }}
    />
  )
}
