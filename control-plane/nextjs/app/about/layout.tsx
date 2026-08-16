import type { Metadata } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://churchnepal.com';

export const metadata: Metadata = {
  title: "About Church Nepal",
  description:
    "Church Nepal builds and hosts websites for churches in Nepal, giving each church its own subdomain, database and media storage, alongside a public church directory.",
  alternates: { canonical: `${SITE_URL}/about` },
  openGraph: {
    title: "About Church Nepal",
    description:
      "Church Nepal builds and hosts websites for churches in Nepal, giving each church its own subdomain, database and media storage, alongside a public church directory.",
    url: `${SITE_URL}/about`,
    type: 'website',
  },
};

// The page is a client component and so cannot export metadata itself. This
// pass-through layout exists only to carry it.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
