import { PricingSection } from '../pricing-section';
import { PricingCalculator } from '../components/pricing-calculator';
import PublicLayout from '../public-layout';
import CtaSection from '../cta-section';

export default function PricingPage() {
  return (
    <PublicLayout>
      <main>
        <PricingSection />
        <div className="py-16 bg-[var(--bg)]">
          <div className="container mx-auto px-4 max-w-3xl">
            <PricingCalculator />
          </div>
        </div>
        <CtaSection />
      </main>
    </PublicLayout>
  );
}
