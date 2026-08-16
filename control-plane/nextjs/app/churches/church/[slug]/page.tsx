import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import PublicLayout from '@/public-layout';
import { getChurches, citySlug, type Church } from '@/lib/churches';
import { getChurchPublicData } from '@/lib/churchApi';

// The church list and every church's own data are only reachable in-cluster,
// so building this statically would freeze an empty page into the HTML.
export const dynamic = 'force-dynamic';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://churchnepal.com';

async function findChurch(slug: string): Promise<Church | undefined> {
  return (await getChurches()).find((c) => c.slug === slug);
}

function placeLine(c: Church): string {
  return [c.city, c.district, c.province].filter(Boolean).join(', ') || 'Nepal';
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> },
): Promise<Metadata> {
  const { slug } = await params;
  const church = await findChurch(slug);
  if (!church) return {};

  const where = placeLine(church);
  const description = `${church.name} in ${where}. Sunday worship service times, address, phone number and contact details, and a link to the church's own website.`;

  return {
    title: `${church.name} — ${church.city ? `Church in ${church.city}, ` : ''}Nepal`,
    description,
    alternates: { canonical: `${SITE_URL}/churches/church/${church.slug}` },
    openGraph: {
      images: ['/opengraph-image'],
      title: `${church.name} — ${where}`,
      description,
      url: `${SITE_URL}/churches/church/${church.slug}`,
      type: 'website',
    },
  };
}

export default async function ChurchProfilePage(
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const church = await findChurch(slug);
  if (!church) notFound();

  // If the church's own API is unreachable the page still stands up on the
  // name, location and link — a thinner page beats a 500 or a spinner.
  const { serviceTimes, contact, ministries } = await getChurchPublicData(church.subdomain);
  const where = placeLine(church);
  const site = `https://${church.subdomain}`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Church',
    name: church.name,
    url: site,
    // The profile is a page *about* the church; the church's own site is the
    // church's URL. Saying otherwise makes this page compete with it.
    mainEntityOfPage: { '@type': 'WebPage', '@id': `${SITE_URL}/churches/church/${church.slug}` },
    address: {
      '@type': 'PostalAddress',
      ...(contact?.address ? { streetAddress: contact.address } : {}),
      ...(church.city ? { addressLocality: church.city } : {}),
      ...(church.province ? { addressRegion: church.province } : {}),
      addressCountry: 'NP',
    },
    ...(contact?.phone ? { telephone: contact.phone } : {}),
    ...(contact?.email ? { email: contact.email } : {}),
    ...(contact?.map_url ? { hasMap: contact.map_url } : {}),
    ...(ministries.length
      ? { knowsAbout: ministries.map((m) => m.name) }
      : {}),
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Church Directory', item: `${SITE_URL}/churches` },
        ...(church.city
          ? [{ '@type': 'ListItem', position: 2, name: `Churches in ${church.city}`, item: `${SITE_URL}/churches/${citySlug(church.city)}` }]
          : []),
        { '@type': 'ListItem', position: church.city ? 3 : 2, name: church.name, item: `${SITE_URL}/churches/church/${church.slug}` },
      ],
    },
  };

  return (
    <PublicLayout>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <main className="container mx-auto px-4 max-w-4xl py-12">
        <nav className="text-sm text-[var(--muted)] mb-6">
          <Link href="/churches" className="hover:underline">Church Directory</Link>
          {church.city && (
            <>
              <span className="mx-2">/</span>
              <Link href={`/churches/${citySlug(church.city)}`} className="hover:underline">{church.city}</Link>
            </>
          )}
          <span className="mx-2">/</span>
          <span>{church.name}</span>
        </nav>

        <h1 className="text-4xl font-bold mb-2">{church.name}</h1>
        <p className="text-[var(--muted)] mb-8">{where}</p>

        <a
          href={site}
          target="_blank"
          rel="noopener"
          className="inline-block rounded-md bg-[var(--accent)] text-[var(--accent-contrast)] px-5 py-2.5 font-medium hover:opacity-90 transition-opacity"
        >
          Visit {church.name}
        </a>

        {serviceTimes.length > 0 && (
          <section className="mt-12">
            <h2 className="text-2xl font-semibold mb-4">Service times</h2>
            <ul className="divide-y divide-[var(--border)] rounded-lg border border-[var(--border)]">
              {serviceTimes.map((t, i) => (
                <li key={`${t.day}-${t.time}-${i}`} className="flex flex-wrap items-baseline justify-between gap-2 px-5 py-3">
                  <span className="font-medium">{t.name}</span>
                  <span className="text-[var(--muted)]">{t.day} · {t.time}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {contact && (
          <section className="mt-12">
            <h2 className="text-2xl font-semibold mb-4">Contact and location</h2>
            <dl className="grid gap-3 sm:grid-cols-[8rem_1fr] text-[15px]">
              {contact.address && (<><dt className="text-[var(--muted)]">Address</dt><dd>{contact.address}</dd></>)}
              {contact.phone && (<><dt className="text-[var(--muted)]">Phone</dt><dd><a href={`tel:${contact.phone.replace(/\s+/g, '')}`} className="underline">{contact.phone}</a></dd></>)}
              {contact.email && (<><dt className="text-[var(--muted)]">Email</dt><dd><a href={`mailto:${contact.email}`} className="underline">{contact.email}</a></dd></>)}
              {contact.hours && (<><dt className="text-[var(--muted)]">Office hours</dt><dd>{contact.hours}</dd></>)}
            </dl>
            {contact.map_url && (
              <p className="mt-4 text-sm">
                <a href={contact.map_url} target="_blank" rel="noopener" className="underline">View on map</a>
              </p>
            )}
          </section>
        )}

        {ministries.length > 0 && (
          <section className="mt-12">
            <h2 className="text-2xl font-semibold mb-4">Ministries</h2>
            <ul className="flex flex-wrap gap-2">
              {ministries.map((m) => (
                <li key={m.id} className="text-sm rounded-md border border-[var(--border)] px-3 py-1.5">{m.name}</li>
              ))}
            </ul>
          </section>
        )}

        {serviceTimes.length === 0 && !contact && (
          <p className="mt-12 text-[var(--muted)] max-w-2xl">
            {church.name} publishes its service times, address and contact details on its own
            website. <a href={site} target="_blank" rel="noopener" className="underline">Visit {church.subdomain}</a>{' '}
            for the latest.
          </p>
        )}

        <section className="mt-14 border-t border-[var(--border)] pt-8 text-sm text-[var(--muted)]">
          <p>
            {church.city ? (
              <>
                Looking for another church?{' '}
                <Link href={`/churches/${citySlug(church.city)}`} className="underline">Churches in {church.city}</Link>
                {' · '}
              </>
            ) : null}
            <Link href="/churches" className="underline">Full church directory</Link>
          </p>
        </section>
      </main>
    </PublicLayout>
  );
}
