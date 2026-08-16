import type { Metadata } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://churchnepal.com';

export const metadata: Metadata = {
  title: "Documentation for Church Website Administrators",
  description:
    "Guides for running a church website on Church Nepal: setup, sermons, events, notices, members, online giving, media library and administrator settings.",
  alternates: { canonical: `${SITE_URL}/docs` },
  openGraph: {
    title: "Documentation for Church Website Administrators",
    description:
      "Guides for running a church website on Church Nepal: setup, sermons, events, notices, members, online giving, media library and administrator settings.",
    url: `${SITE_URL}/docs`,
    type: 'website',
  },
};

// The page is a client component and so cannot export metadata itself. This
// pass-through layout exists only to carry it.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
