import type { Metadata } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://churchnepal.com';

export const metadata: Metadata = {
  title: "Changelog — What's New on Church Nepal",
  description:
    "Recent releases and improvements to the Church Nepal platform for church websites.",
  alternates: { canonical: `${SITE_URL}/changelog` },
  openGraph: {
    images: ['/opengraph-image'],
    title: "Changelog — What's New on Church Nepal",
    description:
      "Recent releases and improvements to the Church Nepal platform for church websites.",
    url: `${SITE_URL}/changelog`,
    type: 'website',
  },
};

// The page is a client component and so cannot export metadata itself. This
// pass-through layout exists only to carry it.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
