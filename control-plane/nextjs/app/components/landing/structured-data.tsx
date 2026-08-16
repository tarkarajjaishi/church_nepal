export default function StructuredData() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://churchnepal.com';

  // A @graph rather than a single node: Organization says who the entity is,
  // WebSite carries the name a search engine shows and the sitelinks search
  // box, and SoftwareApplication describes the product. Emitting only the
  // Organization meant nothing on the page identified the site itself.
  const graph = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${siteUrl}/#organization`,
        name: 'Church Nepal',
        alternateName: ['ChurchNepal', 'Church Nepal Directory'],
        url: siteUrl,
        description:
          'Church Nepal is a platform to discover churches, Christian communities, worship services, events, Bible studies, prayer meetings and Christian resources across Nepal.',
        areaServed: { '@type': 'Country', name: 'Nepal' },
        knowsLanguage: ['en', 'ne'],
      },
      {
        '@type': 'WebSite',
        '@id': `${siteUrl}/#website`,
        url: siteUrl,
        name: 'Church Nepal',
        description:
          'Churches, Christian community and resources in Nepal.',
        publisher: { '@id': `${siteUrl}/#organization` },
        inLanguage: ['en', 'ne'],
        potentialAction: {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: `${siteUrl}/churches?q={search_term_string}`,
          },
          'query-input': 'required name=search_term_string',
        },
      },
      {
        '@type': 'SoftwareApplication',
        '@id': `${siteUrl}/#platform`,
        name: 'Church Nepal Platform',
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web',
        url: siteUrl,
        description:
          'Gives each church its own website — subdomain, isolated database and storage — with service times, sermons, events, ministries, giving and an admin console.',
        publisher: { '@id': `${siteUrl}/#organization` },
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }}
    />
  );
}
