import type { Metadata } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://churchnepal.com';

export const metadata: Metadata = {
  title: "Contact Church Nepal",
  description:
    "Get in touch with Church Nepal to list your church in the directory, start a church website, or ask about plans, migration and support.",
  alternates: { canonical: `${SITE_URL}/contact` },
  openGraph: {
    images: ['/opengraph-image'],
    title: "Contact Church Nepal",
    description:
      "Get in touch with Church Nepal to list your church in the directory, start a church website, or ask about plans, migration and support.",
    url: `${SITE_URL}/contact`,
    type: 'website',
  },
};

// The page is a client component and so cannot export metadata itself. This
// pass-through layout exists only to carry it.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
