import type { Metadata } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://churchnepal.com';

export const metadata: Metadata = {
  title: "Security at Church Nepal",
  description:
    "How Church Nepal protects church data: an isolated database and media store per church, encrypted connections, access control and backups.",
  alternates: { canonical: `${SITE_URL}/security` },
  openGraph: {
    images: ['/opengraph-image'],
    title: "Security at Church Nepal",
    description:
      "How Church Nepal protects church data: an isolated database and media store per church, encrypted connections, access control and backups.",
    url: `${SITE_URL}/security`,
    type: 'website',
  },
};

// The page is a client component and so cannot export metadata itself. This
// pass-through layout exists only to carry it.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
