import type { Metadata } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://churchnepal.com';

export const metadata: Metadata = {
  title: "Church Website Templates",
  description:
    "Website templates for churches in Nepal. Each covers services, sermons, events, ministries, giving and contact, ready to fill with a church's own content.",
  alternates: { canonical: `${SITE_URL}/templates` },
  openGraph: {
    title: "Church Website Templates",
    description:
      "Website templates for churches in Nepal. Each covers services, sermons, events, ministries, giving and contact, ready to fill with a church's own content.",
    url: `${SITE_URL}/templates`,
    type: 'website',
  },
};

// The page is a client component and so cannot export metadata itself. This
// pass-through layout exists only to carry it.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
