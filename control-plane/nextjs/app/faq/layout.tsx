import type { Metadata } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://churchnepal.com';

export const metadata: Metadata = {
  title: "Frequently Asked Questions About Church Websites",
  description:
    "Answers about Church Nepal: what a church website includes, how each church gets its own subdomain and database, pricing in NPR, online giving, migration and support.",
  alternates: { canonical: `${SITE_URL}/faq` },
  openGraph: {
    title: "Frequently Asked Questions About Church Websites",
    description:
      "Answers about Church Nepal: what a church website includes, how each church gets its own subdomain and database, pricing in NPR, online giving, migration and support.",
    url: `${SITE_URL}/faq`,
    type: 'website',
  },
};

// The page is a client component and so cannot export metadata itself. This
// pass-through layout exists only to carry it.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
