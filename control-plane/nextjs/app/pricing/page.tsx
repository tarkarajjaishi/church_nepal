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
