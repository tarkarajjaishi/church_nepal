import type { Metadata } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://churchnepal.com';

export const metadata: Metadata = {
  title: "Migrate Your Church Website to Church Nepal",
  description:
    "Move an existing church website to Church Nepal — content, sermons, events and media — and keep your church's own domain.",
  alternates: { canonical: `${SITE_URL}/migrate` },
  openGraph: {
    title: "Migrate Your Church Website to Church Nepal",
    description:
      "Move an existing church website to Church Nepal — content, sermons, events and media — and keep your church's own domain.",
    url: `${SITE_URL}/migrate`,
    type: 'website',
  },
};

// The page is a client component and so cannot export metadata itself. This
// pass-through layout exists only to carry it.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
