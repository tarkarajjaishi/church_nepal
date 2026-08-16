import type { Metadata } from 'next';
import Link from 'next/link';
import PublicLayout from '@/public-layout';
import {
  getChurches, slugify, cityLabel, nePlace,
  allCities, allDistricts, allProvinces,
  churchesInCity, churchesInDistrict, churchesInProvince,
  type Church,
} from '@/lib/churches';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://churchnepal.com';

export type Kind = 'city' | 'district' | 'province';
export type Lang = 'en' | 'ne';

/**
 * One renderer for every place page.
 *
 * City, district and province pages differ only in which field they filter on
 * and what the heading calls the place; the Nepali versions differ only in
 * copy. Five near-identical page files is five places to fix the next schema
 * or layout change, so the routes are thin and everything lives here.
 */

const BY_KIND = {
  city: { all: allCities, filter: churchesInCity, path: (s: string) => `/churches/${s}` },
  district: { all: allDistricts, filter: churchesInDistrict, path: (s: string) => `/churches/district/${s}` },
  province: { all: allProvinces, filter: churchesInProvince, path: (s: string) => `/churches/province/${s}` },
} as const;

/** English and Nepali live on separate URLs and point at each other with hreflang. */
function paths(kind: Kind, slug: string) {
  const en = BY_KIND[kind].path(slug);
  return { en, ne: kind === 'city' ? `/ne${en}` : en };
}

/**
 * Nepali suffixes attach to the place name with no space — "काठमाडौंमा", not
 * "काठमाडौं मा" — so the label is built by concatenation, not a template with
 * a gap in it.
 */
function labels(kind: Kind, lang: Lang, slug: string) {
  const en = cityLabel(slug);
  if (lang === 'en') {
    const suffix = kind === 'city' ? '' : kind === 'district' ? ' District' : ' Province';
    return { place: en, full: `${en}${suffix}`, heading: `Churches in ${en}${suffix}` };
  }
  const ne = nePlace(en);
  const suffix = kind === 'city' ? '' : kind === 'district' ? ' जिल्ला' : ' प्रदेश';
  return { place: ne, full: `${ne}${suffix}`, heading: `${ne}${suffix}मा चर्च` };
}

export async function placeMetadata(kind: Kind, lang: Lang, slug: string): Promise<Metadata> {
  const { full, heading } = labels(kind, lang, slug);
  const found = BY_KIND[kind].filter(await getChurches(), slug);
  const p = paths(kind, slug);

  // The count goes in the description only when there is one. "0 churches" as
  // a meta description is a worse result than a plain invitation to visit.
  const description = lang === 'en'
    ? (found.length
      ? `${found.length} ${found.length === 1 ? 'church' : 'churches'} in ${full}, Nepal. Sunday worship service times, Bible study, prayer meetings, ministries and contact details for churches in ${full}.`
      : `Churches in ${full}, Nepal. Find Sunday worship, service times, Bible study and prayer meetings. Churches in ${full} can list their website on Church Nepal.`)
    : (found.length
      ? `${full}मा रहेका ${found.length} वटा चर्च। आइतबारको आराधना समय, बाइबल अध्ययन, प्रार्थना सभा र सम्पर्क विवरण चर्च नेपालमा हेर्नुहोस्।`
      : `${full}मा रहेका चर्चहरू। आइतबारको आराधना, बाइबल अध्ययन र प्रार्थना सभाको जानकारी। आफ्नो चर्च चर्च नेपालमा सूचीबद्ध गर्न सक्नुहुन्छ।`);

  const title = lang === 'en'
    ? `Churches in ${full} — Church Directory ${full}, Nepal`
    : `${heading} — नेपाल चर्च निर्देशिका`;

  const canonical = lang === 'en' ? p.en : p.ne;

  return {
    title,
    description,
    alternates: {
      canonical: `${SITE_URL}${canonical}`,
      // Only city pages have a Nepali twin; self-referencing hreflang on the
      // others would point Google at a page that does not exist.
      ...(kind === 'city'
        ? { languages: { 'en-NP': `${SITE_URL}${p.en}`, ne: `${SITE_URL}${p.ne}`, 'x-default': `${SITE_URL}${p.en}` } }
        : {}),
    },
    openGraph: {
      images: ['/opengraph-image'],
      title: heading, description, url: `${SITE_URL}${canonical}`, type: 'website' },
  };
}

function T(lang: Lang, kind: Kind) {
  const noun = { city: ['cities', 'सहरहरू'], district: ['districts', 'जिल्लाहरू'], province: ['provinces', 'प्रदेशहरू'] }[kind];
  return lang === 'en'
    ? {
      crumb: 'Church Directory', crumbHref: '/churches',
      visit: 'Visit website', contact: 'Contact',
      others: `Other ${noun[0]}`,
      lede: (n: number, place: string) =>
        `${n} ${n === 1 ? 'church' : 'churches'} in ${place} with a website on Church Nepal. Each publishes its own Sunday service times, worship, Bible study, prayer meetings and contact details.`,
      emptyTitle: (place: string) => `No churches in ${place} are listed on Church Nepal yet.`,
    }
    : {
      crumb: 'चर्च निर्देशिका', crumbHref: '/ne/churches',
      visit: 'वेबसाइट हेर्नुहोस्', contact: 'सम्पर्क',
      others: `अन्य ${noun[1]}`,
      lede: (n: number, place: string) =>
        `चर्च नेपालमा वेबसाइट भएका ${place}का ${n} वटा चर्च। प्रत्येक चर्चले आफ्नै आराधना समय, बाइबल अध्ययन, प्रार्थना सभा र सम्पर्क विवरण आफ्नो वेबसाइटमा प्रकाशित गर्छ।`,
      emptyTitle: (place: string) => `${place}मा चर्च नेपालमा सूचीबद्ध कुनै चर्च छैन।`,
    };
}

export default async function PlaceDirectory(
  { kind, lang, slug }: { kind: Kind; lang: Lang; slug: string },
) {
  const churches = await getChurches();
  const found = BY_KIND[kind].filter(churches, slug);
  const { full, heading } = labels(kind, lang, slug);
  const t = T(lang, kind);
  const p = paths(kind, slug);
  const here = lang === 'en' ? p.en : p.ne;
  const linkTo = (s: string) => (lang === 'ne' && kind === 'city' ? `/ne` : '') + BY_KIND[kind].path(s);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: heading,
    url: `${SITE_URL}${here}`,
    inLanguage: lang === 'en' ? 'en-NP' : 'ne-NP',
    about: {
      '@type': kind === 'city' ? 'Place' : 'AdministrativeArea',
      name: full,
      address: { '@type': 'PostalAddress', addressLocality: cityLabel(slug), addressCountry: 'NP' },
    },
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: t.crumb, item: `${SITE_URL}${t.crumbHref}` },
        { '@type': 'ListItem', position: 2, name: heading, item: `${SITE_URL}${here}` },
      ],
    },
    // Only claim an ItemList when there is one. An empty list is a promise the
    // page cannot keep, and an answer engine will quote it as "no churches".
    ...(found.length
      ? {
        mainEntity: {
          '@type': 'ItemList',
          numberOfItems: found.length,
          itemListElement: found.map((c: Church, i: number) => ({
            '@type': 'ListItem',
            position: i + 1,
            item: {
              '@type': 'Church',
              name: c.name,
              url: `https://${c.subdomain}`,
              address: {
                '@type': 'PostalAddress',
                addressLocality: c.city || cityLabel(slug),
                ...(c.province ? { addressRegion: c.province } : {}),
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
      {/* The root layout owns <html lang>, so the Nepali pages declare their
          language on the content instead — screen readers honour it. */}
      <main lang={lang === 'ne' ? 'ne' : undefined} className="container mx-auto px-4 max-w-5xl py-12">
        <nav className="text-sm text-[var(--muted)] mb-6">
          <Link href={t.crumbHref} className="hover:underline">{t.crumb}</Link>
          <span className="mx-2">/</span>
          <span>{full}</span>
        </nav>

        <h1 className="text-4xl font-bold mb-3">{heading}</h1>

        {found.length > 0 ? (
          <>
            <p className="text-[var(--muted)] max-w-2xl mb-10">{t.lede(found.length, full)}</p>
            <ul className="grid gap-4 sm:grid-cols-2">
              {found.map((c: Church) => (
                <li key={c.slug} className="rounded-lg border border-[var(--border)] p-5 hover:border-[var(--accent)] transition-colors">
                  <h2 className="text-lg font-semibold mb-1">
                    {/* Internal, so the profile pages are crawlable; the
                        outbound link to the church's own site is below. */}
                    <Link href={`/churches/church/${c.slug}`} className="hover:underline">{c.name}</Link>
                  </h2>
                  <p className="text-sm text-[var(--muted)]">
                    {[c.city, c.district, c.province].filter(Boolean).join(', ') || full}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-3 text-sm">
                    <a href={`https://${c.subdomain}/`} target="_blank" rel="noopener" className="underline">{t.visit}</a>
                    <a href={`https://${c.subdomain}/contact`} target="_blank" rel="noopener" className="underline">{t.contact}</a>
                  </div>
                </li>
              ))}
            </ul>
          </>
        ) : (
          // Says so plainly. Padding this with filler about the place would
          // read as a page about churches while containing none.
          <div className="rounded-lg border border-[var(--border)] p-6 max-w-2xl">
            <p className="mb-3">{t.emptyTitle(full)}</p>
            <p className="text-[var(--muted)] text-sm">
              {lang === 'en' ? (
                <>
                  If your church is in {full},{' '}
                  <Link href="/contact" className="underline">get in touch</Link>{' '}
                  and it can have its own website and directory listing. You can also{' '}
                  <Link href={t.crumbHref} className="underline">browse every listed church</Link>.
                </>
              ) : (
                <>
                  तपाईंको चर्च {full}मा छ भने{' '}
                  <Link href="/contact" className="underline">हामीलाई सम्पर्क गर्नुहोस्</Link>{' '}
                  — आफ्नै वेबसाइट र निर्देशिकामा सूची पाउन सकिन्छ। तपाईं{' '}
                  <Link href={t.crumbHref} className="underline">सबै चर्च हेर्न</Link> पनि सक्नुहुन्छ।
                </>
              )}
            </p>
          </div>
        )}

        <section className="mt-14 border-t border-[var(--border)] pt-8">
          <h2 className="text-2xl font-semibold mb-4">{t.others}</h2>
          <div className="flex flex-wrap gap-2">
            {BY_KIND[kind].all(churches)
              .filter((n: string) => slugify(n) !== slug)
              .map((n: string) => (
                <Link
                  key={n}
                  href={linkTo(slugify(n))}
                  className="text-sm rounded-md border border-[var(--border)] px-3 py-1.5 hover:border-[var(--accent)] transition-colors"
                >
                  {lang === 'en' ? n : nePlace(n)}
                </Link>
              ))}
          </div>
          {kind === 'city' && (
            <p className="mt-6 text-sm text-[var(--muted)]">
              <Link href={lang === 'en' ? `/ne${p.en}` : p.en} className="underline" hrefLang={lang === 'en' ? 'ne' : 'en'}>
                {lang === 'en' ? `${heading} — नेपालीमा हेर्नुहोस्` : `Read this page in English`}
              </Link>
            </p>
          )}
        </section>
      </main>
    </PublicLayout>
  );
}
