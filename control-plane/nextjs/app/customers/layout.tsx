import type { Metadata } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://churchnepal.com';

export const metadata: Metadata = {
  title: "Churches Using Church Nepal",
  description:
    "Churches across Nepal running their website on Church Nepal — what they publish and how their congregations use it.",
  alternates: { canonical: `${SITE_URL}/customers` },
  openGraph: {
    title: "Churches Using Church Nepal",
    description:
      "Churches across Nepal running their website on Church Nepal — what they publish and how their congregations use it.",
    url: `${SITE_URL}/customers`,
    type: 'website',
  },
};

// The page is a client component and so cannot export metadata itself. This
// pass-through layout exists only to carry it.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
