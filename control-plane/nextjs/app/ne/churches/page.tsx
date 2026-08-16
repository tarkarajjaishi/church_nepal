import type { Metadata } from 'next';
import Link from 'next/link';
import PublicLayout from '@/public-layout';
import { getChurches, allCities, citySlug, nePlace, type Church } from '@/lib/churches';

// Same as the English directory: the church list only resolves inside the
// cluster, so building this statically freezes an empty list into the HTML.
export const dynamic = 'force-dynamic';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://churchnepal.com';

export const metadata: Metadata = {
  title: 'नेपाल चर्च निर्देशिका — नेपालमा चर्च खोज्नुहोस्',
  description:
    'नेपालका चर्चहरूको निर्देशिका। सहर अनुसार चर्च खोज्नुहोस् र आइतबारको आराधना समय, बाइबल अध्ययन, प्रार्थना सभा र सम्पर्क विवरणका लागि चर्चको आफ्नै वेबसाइट हेर्नुहोस्।',
  alternates: {
    canonical: `${SITE_URL}/ne/churches`,
    languages: {
      'en-NP': `${SITE_URL}/churches`,
      ne: `${SITE_URL}/ne/churches`,
      'x-default': `${SITE_URL}/churches`,
    },
  },
  openGraph: {
    title: 'नेपाल चर्च निर्देशिका',
    description: 'नेपालका चर्चहरू: वेबसाइट, आराधना समय, बाइबल अध्ययन र सम्पर्क विवरण।',
    url: `${SITE_URL}/ne/churches`,
    type: 'website',
  },
};

export default async function NeChurchesPage() {
  const churches = await getChurches();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'नेपाल चर्च निर्देशिका',
    description: 'चर्च नेपालमा सूचीबद्ध नेपालका चर्चहरू।',
    url: `${SITE_URL}/ne/churches`,
    inLanguage: 'ne-NP',
    about: { '@type': 'Thing', name: 'नेपालका चर्चहरू' },
    ...(churches.length
      ? {
        mainEntity: {
          '@type': 'ItemList',
          numberOfItems: churches.length,
          itemListElement: churches.map((c: Church, i: number) => ({
            '@type': 'ListItem',
            position: i + 1,
            item: {
              '@type': 'Church',
              name: c.name,
              url: `https://${c.subdomain}`,
              address: { '@type': 'PostalAddress', addressCountry: 'NP' },
            },
          })),
        },
      }
      : {}),
  };

  return (
    <PublicLayout>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {/* The root layout owns <html lang>, so the Nepali pages declare their
          language on the content instead — screen readers honour it. */}
      <main lang="ne" className="container mx-auto px-4 max-w-5xl py-12">
        <h1 className="text-4xl font-bold mb-3">नेपाल चर्च निर्देशिका</h1>
        <p className="text-[var(--muted)] max-w-2xl mb-10">
          चर्च नेपालमा वेबसाइट भएका नेपालका चर्चहरू। प्रत्येक चर्चले आफ्नै आराधना समय,
          आइतबारको आराधना, बाइबल अध्ययन, प्रार्थना सभा, सेवकाई र सम्पर्क विवरण आफ्नो
          वेबसाइटमा प्रकाशित गर्छ।
        </p>

        {churches.length === 0 ? (
          <p className="text-[var(--muted)]">
            निर्देशिका तयार हुँदैछ। तपाईंको चर्च सूचीबद्ध गर्न{' '}
            <Link href="/contact" className="underline">हामीलाई सम्पर्क गर्नुहोस्</Link>।
          </p>
        ) : (
          <>
            <p className="text-sm text-[var(--muted)] mb-4">{churches.length} वटा चर्च सूचीबद्ध</p>
            <ul className="grid gap-4 sm:grid-cols-2">
              {churches.map((c: Church) => (
                <li key={c.slug} className="rounded-lg border border-[var(--border)] p-5 hover:border-[var(--accent)] transition-colors">
                  <h2 className="text-lg font-semibold mb-1">
                    <a href={`https://${c.subdomain}`} target="_blank" rel="noopener" className="hover:underline">{c.name}</a>
                  </h2>
                  <p className="text-sm text-[var(--muted)] break-all">{c.subdomain}</p>
                  <div className="mt-3 flex flex-wrap gap-3 text-sm">
                    <a href={`https://${c.subdomain}/`} target="_blank" rel="noopener" className="underline">वेबसाइट हेर्नुहोस्</a>
                    <a href={`https://${c.subdomain}/#service-times`} target="_blank" rel="noopener" className="underline">आराधना समय</a>
                    <a href={`https://${c.subdomain}/contact`} target="_blank" rel="noopener" className="underline">सम्पर्क</a>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}

        <section className="mt-14 border-t border-[var(--border)] pt-8">
          <h2 className="text-2xl font-semibold mb-4">सहर अनुसार चर्च हेर्नुहोस्</h2>
          <div className="flex flex-wrap gap-2 mb-10">
            {allCities(churches).map((c: string) => (
              <Link
                key={c}
                href={`/ne/churches/${citySlug(c)}`}
                className="text-sm rounded-md border border-[var(--border)] px-3 py-1.5 hover:border-[var(--accent)] transition-colors"
              >
                {nePlace(c)}मा चर्च
              </Link>
            ))}
          </div>

          <h2 className="text-2xl font-semibold mb-3">नेपालमा चर्च कसरी खोज्ने</h2>
          <p className="text-[var(--muted)] max-w-3xl">
            यहाँ सूचीबद्ध चर्चहरूले आफ्नै आइतबारको आराधना समय, बाइबल अध्ययन समूह, प्रार्थना
            सभा र सेवकाईको जानकारी प्रकाशित गर्छन्। ठेगाना, सम्पर्क नम्बर र बाटोको विवरणका
            लागि चर्चको आफ्नै वेबसाइट हेर्नुहोस्। काठमाडौं, ललितपुर, भक्तपुर, पोखरा, चितवन,
            विराटनगर, धरान, बुटवल र वीरगन्ज लगायत नेपालभरका मण्डलीहरू यसमा समावेश छन्।
          </p>

          <p className="mt-8 text-sm text-[var(--muted)]">
            <Link href="/churches" className="underline" hrefLang="en">Read this directory in English</Link>
          </p>
        </section>
      </main>
    </PublicLayout>
  );
}
