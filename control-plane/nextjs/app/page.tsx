"use client";

import Link from "next/link";
import HowSection from "./how-section";
import FeaturesSection from "./features-section";
import PricingSection from "./pricing-section";
import PublicLayout from "./public-layout";
import { Badge } from "@/components/ui/badge";

// New production landing sections (generated via the Qwen agent)
import Reveal from "@/components/landing/scroll-reveal";
import TrustBar from "@/components/landing/trust-bar";
import LogoMarquee from "@/components/landing/logo-marquee";
import SecuritySection from "@/components/landing/security-section";
import ProvisioningPreview from "@/components/landing/provisioning-preview";
import MetricsBand from "@/components/landing/metrics-band";
import ComparisonSection from "@/components/landing/comparison-section";
import IntegrationsSection from "@/components/landing/integrations-section";
import TestimonialCarousel from "@/components/landing/testimonial-carousel";
import NewsletterSection from "@/components/landing/newsletter-section";
import FaqSearch from "@/components/landing/faq-search";
import FinalCTA from "@/components/landing/final-cta";

export default function Landing() {
  return (
    <PublicLayout>
      <div className="landing">
        {/* Hero */}
        <header className="lp-hero">
          {/* Subtle grid background */}
          <div className="lp-hero-grid" aria-hidden="true" />
          {/* Soft gradient glow */}
          <div className="lp-glow" />
          {/* Eyebrow badge */}
          <Badge variant="outline" className="lp-eyebrow">
            For Church Leaders
          </Badge>
          {/* Headline with gradient highlight */}
          <h1 className="lp-h1">
            Give every church <span className="grad">its own website</span>
            <br />
            in seconds.
          </h1>
          {/* Supporting lead */}
          <p className="lp-lead">
            ChurchNepal spins up a complete site for each church — its own subdomain,
            its own database, its own storage. One platform, many churches, fully isolated.
          </p>
          {/* CTA buttons */}
          <div className="lp-hero-cta">
            <Link href="/pricing" className="lp-btn lp-btn-lg">
              Get Started
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </Link>
            <a href="#how" className="lp-btn lp-btn-ghost lp-btn-lg">
              See how it works
            </a>
          </div>
          {/* Trust pills with real icons */}
          <div className="lp-pills">
            <span className="lp-pill">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm1-13h-2v6h2V9h3l-4 4-4-4h3V5z" />
              </svg>
              1 subdomain / church
            </span>
            <span className="lp-pill">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <ellipse cx="12" cy="12" rx="8" ry="5" />
                <path d="M5 12v4c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2v-4" strokeWidth="2" fill="none" />
              </svg>
              Separate database
            </span>
            <span className="lp-pill">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" strokeWidth="2" fill="none" />
                <circle cx="12" cy="12" r="4" />
              </svg>
              Separate storage
            </span>
            <span className="lp-pill">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <rect x="4" y="8" width="16" height="12" rx="2" />
                <path d="M8 8V6a4 4 0 018 0v2" strokeWidth="2" />
              </svg>
              Instant admin login
            </span>
          </div>
        </header>

        {/* Social proof + tech marquee */}
        <TrustBar />
        <LogoMarquee />

        {/* Features */}
        <FeaturesSection />

        {/* Isolation / security */}
        <Reveal><SecuritySection /></Reveal>

        {/* How it works + animated provisioning */}
        <HowSection />
        <ProvisioningPreview />

        {/* Animated KPI band */}
        <MetricsBand />

        {/* Comparison + integrations */}
        <Reveal><ComparisonSection /></Reveal>
        <Reveal><IntegrationsSection /></Reveal>

        {/* Testimonials carousel */}
        <TestimonialCarousel />

        {/* Pricing */}
        <PricingSection />

        {/* Newsletter */}
        <Reveal><NewsletterSection /></Reveal>

        {/* Searchable FAQ */}
        <FaqSearch />

        {/* Final CTA band */}
        <FinalCTA />
      </div>
    </PublicLayout>
  );
}
