import type { Metadata } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://churchnepal.com';

export const metadata: Metadata = {
  title: "Church Website Features — Sermons, Events, Giving and Members",
  description:
    "Everything a church website on Church Nepal includes: sermon archive, events calendar, online giving, member directory, prayer requests, notices and a Bible reader.",
  alternates: { canonical: `${SITE_URL}/features` },
  openGraph: {
    images: ['/opengraph-image'],
    title: "Church Website Features — Sermons, Events, Giving and Members",
    description:
      "Everything a church website on Church Nepal includes: sermon archive, events calendar, online giving, member directory, prayer requests, notices and a Bible reader.",
    url: `${SITE_URL}/features`,
    type: 'website',
  },
};

// The page is a client component and so cannot export metadata itself. This
// pass-through layout exists only to carry it.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
