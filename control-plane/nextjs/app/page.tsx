import { PricingSection } from './pricing-section';
import { PricingCalculator } from './components/pricing-calculator';
import PublicLayout from './public-layout';
import CtaSection from './cta-section';
import FeaturesSection from './features-section';
import StatsSection from './stats-section';
import FaqSection from './faq-section';
import HowSection from './how-section';

export default function HomePage() {
  return (
    <PublicLayout>
      <main>
        <StatsSection />
        <FeaturesSection />
        <HowSection />
        <PricingSection />
        <PricingCalculator />
        <FaqSection />
        <CtaSection />
      </main>
    </PublicLayout>
  );
}
