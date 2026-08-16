import type { Metadata } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://churchnepal.com';

export const metadata: Metadata = {
  title: "Platform Status",
  description:
    "Current availability of Church Nepal church websites and platform services.",
  alternates: { canonical: `${SITE_URL}/status` },
  openGraph: {
    title: "Platform Status",
    description:
      "Current availability of Church Nepal church websites and platform services.",
    url: `${SITE_URL}/status`,
    type: 'website',
  },
};

// The page is a client component and so cannot export metadata itself. This
// pass-through layout exists only to carry it.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
