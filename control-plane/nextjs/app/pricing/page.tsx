"use client";

import PricingPlansSection from "./pricing-plans-section";
import PricingCtaSection from "./pricing-cta-section";
import FeatureComparisonTable from "./feature-comparison-table";
import PricingFaqSection from "./pricing-faq-section";
import PublicLayout from "../public-layout";

export default function PricingPage() {
  return (
    <PublicLayout>
      <div className="pricing-page bg-[var(--bg)] min-h-screen">
        <div className="max-w-[var(--max)] mx-auto">
          {/* Hero Section */}
          <section className="section-wrapper-lg">
            <div className="text-center mb-[var(--space-10)]">
              <h1 className="lp-h1 mb-[var(--space-3)]">
                Simple, transparent pricing
              </h1>
              <p className="lp-sub2 max-w-2xl mx-auto">
                Choose the plan that fits your church's needs. All plans include core features
                with differences in member limits, storage, and advanced capabilities.
              </p>
            </div>
          </section>

          {/* Pricing Plans */}
          <PricingPlansSection />

          {/* Feature Comparison Table */}
          <FeatureComparisonTable />

          {/* Pricing FAQ */}
          <PricingFaqSection />

          {/* CTA Band */}
          <PricingCtaSection />
        </div>
      </div>
    </PublicLayout>
  );
}