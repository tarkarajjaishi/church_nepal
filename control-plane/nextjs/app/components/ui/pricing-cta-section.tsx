"use client";

import { useI18n } from "@/components/i18n-hook";

export default function PricingCtaSection() {
  const { t } = useI18n();
  
  return (
    <section className="pricing-cta-section">
      <div className="pricing-cta-content">
        <h3 className="pricing-cta-title">{t("pricing.cta")}</h3>
        <p className="pricing-cta-description">
          Start your 14-day free trial today. No credit card required.
        </p>
        <button className="pricing-cta-button">
          {t("pricing.trial")}
        </button>
      </div>
    </section>
  );
}