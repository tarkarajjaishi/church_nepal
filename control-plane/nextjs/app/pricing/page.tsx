import type { Metadata } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://churchnepal.com';

export const metadata: Metadata = {
  title: 'Church Website Pricing in Nepal — Plans in NPR',
  description:
    'Church Nepal pricing in Nepali rupees. Compare plans for a church website with its own subdomain, database, sermons, events, online giving and member management.',
  alternates: { canonical: `${SITE_URL}/pricing` },
  openGraph: {
    images: ['/opengraph-image'],
    title: 'Church Website Pricing in Nepal — Plans in NPR',
    description:
      'Church Nepal pricing in Nepali rupees. Compare plans for a church website with its own subdomain, database, sermons, events, online giving and member management.',
    url: `${SITE_URL}/pricing`,
    type: 'website',
  },
};

import { PricingSection } from '../pricing-section';
import PublicLayout from '../public-layout';
import CtaSection from '../cta-section';

// The "Estimate Your Costs" calculator was removed on request. The component
// still exists at ../components/pricing-calculator if it is ever wanted back.
export default function PricingPage() {
  return (
    <PublicLayout>
      <main>
        <PricingSection />
        <CtaSection />
      </main>
    </PublicLayout>
  );
}
