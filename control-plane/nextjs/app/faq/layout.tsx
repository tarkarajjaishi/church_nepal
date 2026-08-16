import type { Metadata } from 'next';
import { faqData } from '@/lib/faq-data';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://churchnepal.com';

export const metadata: Metadata = {
  title: "Frequently Asked Questions About Church Websites",
  description:
    "Answers about Church Nepal: what a church website includes, how each church gets its own subdomain and database, pricing in NPR, online giving, migration and support.",
  alternates: { canonical: `${SITE_URL}/faq` },
  openGraph: {
    images: ['/opengraph-image'],
    title: "Frequently Asked Questions About Church Websites",
    description:
      "Answers about Church Nepal: what a church website includes, how each church gets its own subdomain and database, pricing in NPR, online giving, migration and support.",
    url: `${SITE_URL}/faq`,
    type: 'website',
  },
};

// The page is a client component and so cannot export metadata itself. This
// layout carries it, and the FAQPage markup — built from the same module the
// page renders from, because Google requires the marked-up answers to be the
// ones a visitor can actually see on the page.
const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  url: `${SITE_URL}/faq`,
  inLanguage: 'en-NP',
  mainEntity: faqData.flatMap((category) =>
    category.items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  ),
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      {children}
    </>
  );
}
