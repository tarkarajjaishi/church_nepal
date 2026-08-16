import type { Metadata } from 'next';
import Link from 'next/link';
import PublicLayout from '../../public-layout';
import {
  getChurches, allCities, churchesInCity, citySlug, cityLabel,
} from '@/lib/churches';

export const revalidate = 3600;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://churchnepal.com';

export async function generateStaticParams() {
  const churches = await getChurches();
  return allCities(churches).map((c) => ({ city: citySlug(c) }));
}

export async function generateMetadata(
  { params }: { params: Promise<{ city: string }> },
): Promise<Metadata> {
  const { city } = await params;
  const label = cityLabel(city);
  const churches = await getChurches();
  const found = churchesInCity(churches, city);

  // The count goes in the description only when there is one. "0 churches" as
  // a meta description is a worse result than a plain invitation to visit.
  const description = found.length
    ? `${found.length} ${found.length === 1 ? 'church' : 'churches'} in ${label}, Nepal. Find Sunday worship service times, Bible study, prayer meetings, ministries and contact details for churches in ${label}.`
    : `Churches in ${label}, Nepal. Find Sunday worship, service times, Bible study and prayer meetings. Churches in ${label} can list their website on Church Nepal.`;

  return {
    title: `Churches in ${label} — Church Directory ${label}, Nepal`,
    description,
    alternates: { canonical: `${SITE_URL}/churches/${city}` },
    openGraph: {
      title: `Churches in ${label}, Nepal`,
      description,
      url: `${SITE_URL}/churches/${city}`,
      type: 'website',
    },
  };
}

export default async function CityPage({ params }: { params: Promise<{ city: string }> }) {
  const { city } = await params;
  const label = cityLabel(city);
  const churches = await getChurches();
  const found = churchesInCity(churches, city);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `Churches in ${label}`,
    url: `${SITE_URL}/churches/${city}`,
    about: { '@type': 'Place', name: label, address: { '@type': 'PostalAddress', addressLocality: label, addressCountry: 'NP' } },
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Church Directory', item: `${SITE_URL}/churches` },
        { '@type': 'ListItem', position: 2, name: `Churches in ${label}`, item: `${SITE_URL}/churches/${city}` },
      ],
    },
    // Only claim an ItemList when there is one. An empty list is a promise the
    // page cannot keep, and an answer engine will quote it as "no churches".
    ...(found.length
      ? {
          mainEntity: {
            '@type': 'ItemList',
            numberOfItems: found.length,
            itemListElement: found.map((c, i) => ({
              '@type': 'ListItem',
              position: i + 1,
              item: {
                '@type': 'Church',
                name: c.name,
                url: `https://${c.subdomain}`,
                address: {
                  '@type': 'PostalAddress',
                  addressLocality: c.city || label,
                  addressCountry: 'NP',
                },
              },
            })),
          },
        }
      : {}),
  };

  return (
    <PublicLayout>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <main className="container mx-auto px-4 max-w-5xl py-12">
        <nav className="text-sm text-[var(--muted)] mb-6">
          <Link href="/churches" className="hover:underline">Church Directory</Link>
          <span className="mx-2">/</span>
          <span>{label}</span>
        </nav>

        <h1 className="text-4xl font-bold mb-3">Churches in {label}</h1>

        {found.length > 0 ? (
          <>
            <p className="text-[var(--muted)] max-w-2xl mb-10">
              {found.length} {found.length === 1 ? 'church' : 'churches'} in {label} with a website
              on Church Nepal. Each publishes its own Sunday service times, worship, Bible study,
              prayer meetings and contact details.
            </p>
            <ul className="grid gap-4 sm:grid-cols-2">
              {found.map((c) => (
                <li key={c.slug} className="rounded-lg border border-[var(--border)] p-5 hover:border-[var(--accent)] transition-colors">
                  <h2 className="text-lg font-semibold mb-1">
                    <a href={`https://${c.subdomain}`} target="_blank" rel="noopener" className="hover:underline">{c.name}</a>
                  </h2>
                  <p className="text-sm text-[var(--muted)]">
                    {[c.city, c.district, c.province].filter(Boolean).join(', ') || label}, Nepal
                  </p>
                  <div className="mt-3 flex flex-wrap gap-3 text-sm">
                    <a href={`https://${c.subdomain}/`} target="_blank" rel="noopener" className="underline">Visit website</a>
                    <a href={`https://${c.subdomain}/contact`} target="_blank" rel="noopener" className="underline">Contact</a>
                  </div>
                </li>
              ))}
            </ul>
          </>
        ) : (
          // Says so plainly. Padding this with filler about the city would read
          // as a page about churches while containing none.
          <div className="rounded-lg border border-[var(--border)] p-6 max-w-2xl">
            <p className="mb-3">
              No churches in {label} are listed on Church Nepal yet.
            </p>
            <p className="text-[var(--muted)] text-sm">
              If your church is in {label},{' '}
              <Link href="/contact" className="underline">get in touch</Link>{' '}
              and it can have its own website and directory listing. You can also{' '}
              <Link href="/churches" className="underline">browse every listed church</Link>.
            </p>
          </div>
        )}

        <section className="mt-14 border-t border-[var(--border)] pt-8">
          <h2 className="text-2xl font-semibold mb-4">Other cities</h2>
          <div className="flex flex-wrap gap-2">
            {allCities(churches)
              .filter((c) => citySlug(c) !== city)
              .map((c) => (
                <Link
                  key={c}
                  href={`/churches/${citySlug(c)}`}
                  className="text-sm rounded-md border border-[var(--border)] px-3 py-1.5 hover:border-[var(--accent)] transition-colors"
                >
                  {c}
                </Link>
              ))}
          </div>
        </section>
      </main>
    </PublicLayout>
  );
}
