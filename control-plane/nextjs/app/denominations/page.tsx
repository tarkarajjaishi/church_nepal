import type { Metadata } from 'next';
import Link from 'next/link';
import PublicLayout from '@/public-layout';
import { DENOMINATIONS, topicPath } from '@/lib/topics';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://churchnepal.com';
const URL = `${SITE_URL}/denominations`;

export const metadata: Metadata = {
  title: 'Church Denominations in Nepal — Baptist, Catholic, Pentecostal & More',
  description:
    'Baptist, Catholic, Pentecostal, Evangelical, Protestant and other Christian traditions in Nepal — what each believes, what a visitor would notice, and how to find a church.',
  alternates: { canonical: URL },
  openGraph: {
    title: 'Church Denominations in Nepal',
    description:
      'The Christian traditions present in Nepal, what each emphasises, and how they look in a Nepali congregation.',
    url: URL,
    type: 'website',
    images: ['/opengraph-image'],
  },
};

export default function DenominationsIndex() {
  // An ItemList this page can keep: every entry below is a page that exists.
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': URL,
        url: URL,
        name: 'Church Denominations in Nepal',
        inLanguage: 'en-NP',
        mainEntity: {
          '@type': 'ItemList',
          numberOfItems: DENOMINATIONS.length,
          itemListElement: DENOMINATIONS.map((d, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            name: d.h1,
            url: `${SITE_URL}${topicPath(d)}`,
          })),
        },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Church Directory', item: `${SITE_URL}/churches` },
          { '@type': 'ListItem', position: 2, name: 'Denominations', item: URL },
        ],
      },
    ],
  };

  return (
    <PublicLayout>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <main className="container mx-auto px-4 max-w-3xl py-12">
        <nav className="text-sm text-[var(--muted)] mb-6">
          <Link href="/churches" className="hover:underline">Church Directory</Link>
          <span className="mx-2">/</span>
          <span>Denominations</span>
        </nav>

        <h1 className="text-4xl font-bold mb-4">Church Denominations in Nepal</h1>
        <p className="text-lg text-[var(--muted)] mb-8">
          Nepal has churches from most of the world’s Christian traditions, but
          denominational labels sit more loosely here than in Europe or North
          America.
        </p>

        <section className="mb-10">
          <p className="mb-4 leading-relaxed">
            Many Nepali congregations are independent, or belong to a local
            network rather than an international denomination. A church may
            describe itself simply as a Nepali Christian church, take a name
            from its neighbourhood, and hold beliefs and a style of worship
            that a visitor would recognise as both evangelical and
            charismatic — regardless of what is written above the door.
          </p>
          <p className="mb-4 leading-relaxed">
            These pages explain what each tradition emphasises and what you
            would actually notice walking into one, so you can work out what
            you are looking for. The directory does not yet record each
            church’s denomination, so to confirm where a particular
            congregation stands, check its own website or contact it directly.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Christian traditions in Nepal</h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {DENOMINATIONS.map((d) => (
              <li key={d.slug} className="rounded-lg border border-[var(--border)] p-4 hover:border-[var(--accent)] transition-colors">
                <h3 className="font-semibold mb-1">
                  <Link href={topicPath(d)} className="hover:underline">{d.h1}</Link>
                </h3>
                <p className="text-sm text-[var(--muted)]">{d.lede}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-lg border border-[var(--border)] p-6">
          <h2 className="text-xl font-semibold mb-2">Looking for a church near you?</h2>
          <p className="text-sm text-[var(--muted)]">
            Browse{' '}
            <Link href="/churches" className="underline">every church in the directory</Link>{' '}
            or search by city, district and province. If your church is not
            listed,{' '}
            <Link href="/contact" className="underline">get in touch</Link>.
          </p>
        </section>
      </main>
    </PublicLayout>
  );
}
