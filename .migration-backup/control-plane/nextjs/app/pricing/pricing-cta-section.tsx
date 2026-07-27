"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function PricingCtaSection() {
  return (
    <section className="pricing-cta-section">
      <div className="pricing-cta-content">
        <h2 className="pricing-cta-title">Ready to launch your church?</h2>
        <p className="pricing-cta-description">
          Start your 14-day free trial today. No credit card required.
        </p>
        <Link href="/admin">
          <Button variant="default" size="lg">
            Start free trial
          </Button>
        </Link>
      </div>
    </section>
  );
}