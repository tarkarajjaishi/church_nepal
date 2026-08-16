import type { Metadata } from 'next';
import Link from 'next/link';
import PublicLayout from '@/public-layout';
import { SEED_CITIES, citySlug } from '@/lib/churches';
import { topicPath, relatedTopics, type Topic } from '@/lib/topics';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://churchnepal.com';

/**
 * One renderer for every topic page.
 *
 * Unlike the place pages these read no live data, so they stay statically
 * generated — there is nothing here for a build-time empty fetch to freeze,
 * and the city links below come from the SEED_CITIES constant rather than the
 * control API. See lib/topics.ts for why they are not church-data-backed.
 */

const CLUSTER_LABEL = {
  service: 'Church Services',
  ministry: 'Ministries',
  denomination: 'Denominations',
  event: 'Events',
} as const;

/** Denomination pages hang off /denominations; the rest off the directory. */
function crumb(t: Topic) {
  return t.cluster === 'denomination'
    ? { name: 'Denominations', href: '/denominations' }
    : { name: 'Church Directory', href: '/churches' };
}

export function topicMetadata(t: Topic): Metadata {
  const url = `${SITE_URL}${topicPath(t)}`;
  return {
    title: t.metaTitle,
    description: t.metaDescription,
    // Every topic page is its own canonical. Thirty-odd pages once pointed at
    // the homepage and told Google they were duplicates of it.
    alternates: { canonical: url },
    openGraph: {
      title: t.h1,
      description: t.metaDescription,
      url,
      type: 'article',
      images: ['/opengraph-image'],
    },
  };
}

export default function TopicPage({ topic }: { topic: Topic }) {
  const here = topicPath(topic);
  const url = `${SITE_URL}${here}`;
  const c = crumb(topic);
  const related = relatedTopics(topic);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': url,
        url,
        name: topic.h1,
        description: topic.metaDescription,
        inLanguage: 'en-NP',
        about: { '@type': 'Thing', name: topic.h1 },
        isPartOf: { '@type': 'WebSite', name: 'Church Nepal', url: SITE_URL },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: c.name, item: `${SITE_URL}${c.href}` },
          { '@type': 'ListItem', position: 2, name: topic.h1, item: url },
        ],
      },
      // The FAQ answers are the part an answer engine quotes, so they are
      // marked up as well as rendered. Google requires the text be visible on
      // the page for the markup to be eligible — hence both, from one source.
      ...(topic.faqs.length
        ? [{
          '@type': 'FAQPage',
          '@id': `${url}#faq`,
          mainEntity: topic.faqs.map((f) => ({
            '@type': 'Question',
            name: f.q,
            acceptedAnswer: { '@type': 'Answer', text: f.a },
          })),
        }]
        : []),
    ],
  };

  return (
    <PublicLayout>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <main className="container mx-auto px-4 max-w-3xl py-12">
        <nav className="text-sm text-[var(--muted)] mb-6">
          <Link href={c.href} className="hover:underline">{c.name}</Link>
          <span className="mx-2">/</span>
          <span>{topic.h1}</span>
        </nav>

        <h1 className="text-4xl font-bold mb-4">{topic.h1}</h1>
        <p className="text-lg text-[var(--muted)] mb-10">{topic.lede}</p>

        {topic.sections.map((s) => (
          <section key={s.h2} className="mb-10">
            <h2 className="text-2xl font-semibold mb-3">{s.h2}</h2>
            {s.body.map((p, i) => (
              <p key={i} className="mb-4 leading-relaxed">{p}</p>
            ))}
          </section>
        ))}

        {topic.faqs.length > 0 && (
          <section className="mb-12 border-t border-[var(--border)] pt-8">
            <h2 className="text-2xl font-semibold mb-6">Frequently asked questions</h2>
            <dl>
              {topic.faqs.map((f) => (
                <div key={f.q} className="mb-6">
                  <dt className="font-semibold mb-1">{f.q}</dt>
                  <dd className="text-[var(--muted)] leading-relaxed">{f.a}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}

        <section className="rounded-lg border border-[var(--border)] p-6 mb-12">
          <h2 className="text-xl font-semibold mb-2">Find a church in Nepal</h2>
          <p className="text-sm text-[var(--muted)] mb-4">
            Browse the Church Nepal directory, or jump straight to a city. The
            directory is new and still growing — if your church is missing,{' '}
            <Link href="/contact" className="underline">get in touch</Link>.
          </p>
          <div className="flex flex-wrap gap-2">
            <Link href="/churches" className="text-sm rounded-md border border-[var(--border)] px-3 py-1.5 hover:border-[var(--accent)] transition-colors">
              All churches
            </Link>
            {SEED_CITIES.map((city) => (
              <Link
                key={city}
                href={`/churches/${citySlug(city)}`}
                className="text-sm rounded-md border border-[var(--border)] px-3 py-1.5 hover:border-[var(--accent)] transition-colors"
              >
                {city}
              </Link>
            ))}
          </div>
        </section>

        {related.length > 0 && (
          <section className="border-t border-[var(--border)] pt-8">
            <h2 className="text-2xl font-semibold mb-4">More on {CLUSTER_LABEL[topic.cluster]}</h2>
            <div className="flex flex-wrap gap-2">
              {related.map((r) => (
                <Link
                  key={r.slug}
                  href={topicPath(r)}
                  className="text-sm rounded-md border border-[var(--border)] px-3 py-1.5 hover:border-[var(--accent)] transition-colors"
                >
                  {r.h1}
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
    </PublicLayout>
  );
}
