import type { Metadata } from 'next';
import Link from 'next/link';
import PublicLayout from '../public-layout';

export const revalidate = 3600;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://churchnepal.com';
const API = process.env.NEXT_PUBLIC_CONTROL_API || '/api';

export const metadata: Metadata = {
  title: 'Church Directory Nepal — Find a Church in Nepal',
  description:
    'Directory of churches in Nepal on ChurchNepal. Browse Christian churches by name, visit their websites, and find service times, worship, Bible study and contact details.',
  alternates: { canonical: `${SITE_URL}/churches` },
  openGraph: {
    title: 'Church Directory Nepal — Find a Church in Nepal',
    description:
      'Browse churches in Nepal: websites, service times, worship, Bible study and contact details.',
    url: `${SITE_URL}/churches`,
    type: 'website',
  },
};

type Church = { name: string; slug: string; subdomain: string; created_at?: string };

async function getChurches(): Promise<Church[]> {
  try {
    // Server-side, so a relative API base has no host to resolve against.
    const base = API.startsWith('http') ? API : `http://control-api:3100/api`;
    const res = await fetch(`${base}/public/churches`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export default async function ChurchesPage() {
  const churches = await getChurches();

  // ItemList is what lets an answer engine quote the directory as a list of
  // real entities rather than prose it has to infer structure from.
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Church Directory Nepal',
    description: 'Directory of churches in Nepal on ChurchNepal.',
    url: `${SITE_URL}/churches`,
    about: { '@type': 'Thing', name: 'Churches in Nepal' },
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: churches.length,
      itemListElement: churches.map((c, i) => ({
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
  };

  return (
    <PublicLayout>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <main className="container mx-auto px-4 max-w-5xl py-12">
        <h1 className="text-4xl font-bold mb-3">Church Directory Nepal</h1>
        <p className="text-[var(--muted)] max-w-2xl mb-10">
          Churches in Nepal with a website on ChurchNepal. Each church publishes its own
          service times, Sunday worship, Bible study, prayer meetings, ministries and
          contact details on its own site.
        </p>

        {churches.length === 0 ? (
          <p className="text-[var(--muted)]">
            The directory is being populated. If your church would like to be listed,{' '}
            <Link href="/contact" className="underline">get in touch</Link>.
          </p>
        ) : (
          <>
            <p className="text-sm text-[var(--muted)] mb-4">
              {churches.length} {churches.length === 1 ? 'church' : 'churches'} listed
            </p>
            <ul className="grid gap-4 sm:grid-cols-2">
              {churches.map((c) => (
                <li
                  key={c.slug}
                  className="rounded-lg border border-[var(--border)] p-5 hover:border-[var(--accent)] transition-colors"
                >
                  <h2 className="text-lg font-semibold mb-1">
                    <a
                      href={`https://${c.subdomain}`}
                      target="_blank"
                      rel="noopener"
                      className="hover:underline"
                    >
                      {c.name}
                    </a>
                  </h2>
                  <p className="text-sm text-[var(--muted)] break-all">{c.subdomain}</p>
                  <div className="mt-3 flex flex-wrap gap-3 text-sm">
                    <a href={`https://${c.subdomain}/`} target="_blank" rel="noopener" className="underline">
                      Visit website
                    </a>
                    <a href={`https://${c.subdomain}/#service-times`} target="_blank" rel="noopener" className="underline">
                      Service times
                    </a>
                    <a href={`https://${c.subdomain}/contact`} target="_blank" rel="noopener" className="underline">
                      Contact
                    </a>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}

        <section className="mt-14 border-t border-[var(--border)] pt-8">
          <h2 className="text-2xl font-semibold mb-3">Finding a church in Nepal</h2>
          <p className="text-[var(--muted)] max-w-3xl">
            Churches listed here publish their own Sunday service times, worship schedule,
            Bible study groups, prayer meetings and ministries. Visit a church&apos;s website for
            its address, contact number and directions. Churches serve congregations across
            Nepal, including Kathmandu, Lalitpur, Bhaktapur, Pokhara, Chitwan, Biratnagar,
            Dharan, Butwal and Birgunj.
          </p>
        </section>
      </main>
    </PublicLayout>
  );
}
