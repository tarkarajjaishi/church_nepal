import type { Metadata } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://churchnepal.com';

export const metadata: Metadata = {
  // A plain-string title here would reset the root template for the article
  // pages below, leaving them without the site suffix.
  title: {
    default: "Help Center — Church Nepal Support",
    template: "%s · Church Nepal",
  },
  description:
    "Help articles and support for churches using Church Nepal, covering site setup, content, members, giving, domains and troubleshooting.",
  alternates: { canonical: `${SITE_URL}/help` },
  openGraph: {
    title: "Help Center — Church Nepal Support",
    description:
      "Help articles and support for churches using Church Nepal, covering site setup, content, members, giving, domains and troubleshooting.",
    url: `${SITE_URL}/help`,
    type: 'website',
  },
};

// The page is a client component and so cannot export metadata itself. This
// pass-through layout exists only to carry it.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
