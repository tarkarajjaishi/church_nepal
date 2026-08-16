import type { Metadata } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://churchnepal.com';

export const metadata: Metadata = {
  title: "Compare Church Website Builders",
  description:
    "How Church Nepal compares with general website builders for a church in Nepal: subdomains, isolated databases, giving in NPR, Nepali content and church features.",
  alternates: { canonical: `${SITE_URL}/compare` },
  openGraph: {
    title: "Compare Church Website Builders",
    description:
      "How Church Nepal compares with general website builders for a church in Nepal: subdomains, isolated databases, giving in NPR, Nepali content and church features.",
    url: `${SITE_URL}/compare`,
    type: 'website',
  },
};

// The page is a client component and so cannot export metadata itself. This
// pass-through layout exists only to carry it.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
