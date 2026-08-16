import type { Metadata } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://churchnepal.com';

export const metadata: Metadata = {
  title: "Christian Resources for Churches in Nepal",
  description:
    "Resources for churches in Nepal: guides, templates and tools for worship planning, sermons, events, giving and running a church website.",
  alternates: { canonical: `${SITE_URL}/resources` },
  openGraph: {
    images: ['/opengraph-image'],
    title: "Christian Resources for Churches in Nepal",
    description:
      "Resources for churches in Nepal: guides, templates and tools for worship planning, sermons, events, giving and running a church website.",
    url: `${SITE_URL}/resources`,
    type: 'website',
  },
};

// The page is a client component and so cannot export metadata itself. This
// pass-through layout exists only to carry it.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
