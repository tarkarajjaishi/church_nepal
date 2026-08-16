import type { Metadata } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://churchnepal.com';

export const metadata: Metadata = {
  title: "Trust Center",
  description:
    "Church Nepal's commitments on data ownership, privacy, availability and security for churches in Nepal.",
  alternates: { canonical: `${SITE_URL}/trust` },
  openGraph: {
    title: "Trust Center",
    description:
      "Church Nepal's commitments on data ownership, privacy, availability and security for churches in Nepal.",
    url: `${SITE_URL}/trust`,
    type: 'website',
  },
};

// The page is a client component and so cannot export metadata itself. This
// pass-through layout exists only to carry it.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
