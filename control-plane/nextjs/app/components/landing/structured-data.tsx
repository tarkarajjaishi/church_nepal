export default function StructuredData() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://churchnepal.com';
  
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'ChurchNepal',
    url: siteUrl,
    description: 'A comprehensive SaaS platform designed for churches to manage their digital presence, members, events, donations, and more.',
    offers: {
      '@type': 'SoftwareApplication',
      name: 'Church Website Platform',
      applicationCategory: 'BusinessApplication',
      description: 'All-in-one church management software for websites, member engagement, donations, events, and administration.'
    }
  };

  return (
    <script 
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}
