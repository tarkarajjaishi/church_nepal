import type { Metadata } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://churchnepal.com';

// A route group so "/" keeps its URL. The homepage itself is a client
// component and cannot export metadata, and the canonical cannot live on the
// root layout because every other route inherits it from there — which is how
// thirty-odd pages ended up declaring themselves duplicates of this one.
export const metadata: Metadata = {
  alternates: { canonical: SITE_URL },
};

export default function HomeLayout({ children }: { children: React.ReactNode }) {
  return children;
}
