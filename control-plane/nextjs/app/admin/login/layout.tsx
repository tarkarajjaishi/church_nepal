import type { Metadata } from 'next';

// The login page itself is a client component and cannot export metadata, so the
// tab title fell back to the marketing page's ("Give every church its own
// website in seconds"). This server layout supplies a route-correct title.
export const metadata: Metadata = {
  // Root layout applies a "%s · ChurchNepal" template — don't repeat the brand.
  title: 'Master Control Login',
  description: 'Sign in to the ChurchNepal Master Control admin dashboard.',
  robots: { index: false, follow: false },
};

export default function AdminLoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
