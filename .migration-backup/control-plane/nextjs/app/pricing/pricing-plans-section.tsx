"use client";

import { useState } from "react";
import Link from "next/link";
import { usePlans } from "@/components/hooks/use-plans";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface PlanFeature {
  text: string;
  included: boolean;
}

// Feature labels for mapping plan features - expanded for comparison table
const featureLabels: Record<string, string> = {
  own_subdomain: "Own subdomain (yourchurch.churchnepal.com)",
  isolated_database: "Isolated PostgreSQL database",
  private_storage: "Private media storage",
  headless_cms: "Headless CMS for content",
  instant_admin: "Instant admin login",
  beautiful_themes: "Beautiful themes",
  max_members: "Members",
  max_storage_mb: "Storage",
  max_emails: "Email sends/month",
  max_churches: "Churches",
  custom_domain: "Custom domain support",
  priority_support: "Priority support",
  advanced_customization: "Advanced customization",
  api_access: "API access",
  white_labeling: "White labeling",
};

function formatPrice(price: number): string {
  if (price === 0) return "Free";
  return new Intl.NumberFormat("en-NP", {
    style: "currency",
    currency: "NPR",
    minimumFractionDigits: 0,
  }).format(price);
}

// All features for comparison table
const allFeatures: PlanFeature[][] = [
  // Free plan features
  [
    { text: "Own subdomain (yourchurch.churchnepal.com)", included: true },
    { text: "Isolated PostgreSQL database", included: true },
    { text: "Private media storage (100 MB)", included: true },
    { text: "Headless CMS for content", included: true },
    { text: "Instant admin login", included: true },
    { text: "Beautiful themes", included: true },
    { text: "Up to 10 members", included: true },
    { text: "Up to 500 email sends/month", included: true },
    { text: "Subdomain only", included: false },
    { text: "Priority support", included: false },
  ],
  // Standard plan features
  [
    { text: "Own subdomain (yourchurch.churchnepal.com)", included: true },
    { text: "Isolated PostgreSQL database", included: true },
    { text: "Private media storage (1 GB)", included: true },
    { text: "Headless CMS for content", included: true },
    { text: "Instant admin login", included: true },
    { text: "Beautiful themes", included: true },
    { text: "Up to 100 members", included: true },
    { text: "Up to 5,000 email sends/month", included: true },
    { text: "Custom domain support", included: true },
    { text: "Priority support", included: true },
  ],
  // Pro plan features
  [
    { text: "Own subdomain (yourchurch.churchnepal.com)", included: true },
    { text: "Isolated PostgreSQL database", included: true },
    { text: "Private media storage (10 GB)", included: true },
    { text: "Headless CMS for content", included: true },
    { text: "Instant admin login", included: true },
    { text: "Beautiful themes", included: true },
    { text: "Up to 1,000 members", included: true },
    { text: "Up to 50,000 email sends/month", included: true },
    { text: "Custom domain support", included: true },
    { text: "Priority support", included: true },
    { text: "Advanced customization", included: true },
    { text: "API access", included: true },
    { text: "White labeling", included: true },
  ],
];

// Comparison features for the table
const comparisonFeatures = [
  "Own subdomain (yourchurch.churchnepal.com)",
  "Isolated PostgreSQL database",
  "Private media storage",
  "Headless CMS for content",
  "Instant admin login",
  "Beautiful themes",
  "Members",
  "Email sends/month",
  "Custom domain support",
  "Priority support",
  "Advanced customization",
  "API access",
  "White labeling",
];

export default function PricingPlansSection() {
  const [isAnnual, setIsAnnual] = useState(false);
  const { data: plans, isLoading, isError } = usePlans();

  const planData = plans ?? [
    { id: "free", name: "Free", price_monthly: 0, price_annual: 0 },
    { id: "standard", name: "Standard", price_monthly: 2499, price_annual: 29988 },
    { id: "pro", name: "Pro", price_monthly: 14999, price_annual: 179988 },
  ];

  const isRecommended = (planId: string) => planId === "standard";

  if (isLoading) {
    return (
      <section className="section-wrapper-lg">
        <div className="max-w-[var(--max)] mx-auto">
          <div className="pricing-header">
            <div className="h-10 w-64 bg-[var(--panel-2)] rounded animate-pulse mx-auto mb-2" />
            <div className="h-5 w-96 bg-[var(--panel-2)] rounded animate-pulse mx-auto" />
          </div>
          <div className="plans-grid">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="h-96">
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="h-8 w-32 bg-[var(--panel-2)] rounded animate-pulse" />
                    <div className="h-6 w-24 bg-[var(--panel-2)] rounded animate-pulse" />
                    {[1, 2, 3, 4, 5].map((j) => (
                      <div key={j} className="h-4 w-full bg-[var(--panel-2)] rounded animate-pulse" />
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="section-wrapper-lg">
      {/* Billing Toggle */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-3">
          <span className={`text-sm font-medium ${!isAnnual ? "text-[var(--text-strong)]" : "text-[var(--muted)]"}`}>
            Monthly
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={isAnnual}
            onClick={() => setIsAnnual(!isAnnual)}
            className={`
              relative inline-flex h-6 w-11 items-center rounded-full transition-all
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2
              ${isAnnual ? "bg-accent" : "bg-[var(--panel-2)] border border-[var(--border)]"}
            `}
          >
            <span
              className={`
                inline-block h-5 w-5 rounded-full bg-[var(--text-strong)] shadow transition-transform
                ${isAnnual ? "translate-x-6 bg-[var(--accent-contrast)]" : "translate-x-1"}
              `}
            />
          </button>
          <span className={`text-sm font-medium ${isAnnual ? "text-[var(--text-strong)]" : "text-[var(--muted)]"}`}>
            Annual
          </span>
          {isAnnual && (
            <span className="text-xs bg-[var(--good-soft)] text-[var(--good)] px-2 py-1 rounded-full font-semibold">
              Save up to 20%
            </span>
          )}
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="plans-grid">
        {planData.map((plan, index) => {
          const features = allFeatures[index] || [];
          const price = isAnnual ? plan.price_annual : plan.price_monthly;
          const period = isAnnual ? "/year" : "/month";
          const recommended = isRecommended(plan.id);

          return (
            <Card
              key={plan.id}
              className={`
                flex flex-col h-full relative transition-all
                ${recommended
                  ? "border-[var(--accent)] shadow-md scale-105 md:scale-105 z-10"
                  : "hover:border-[var(--accent)]"
                }
              `}
            >
              {/* Recommended badge */}
              {recommended && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-gradient-to-r from-accent to-accent-2 text-[var(--accent-contrast)] px-3 py-1 rounded-full text-xs font-semibold shadow">
                    Recommended
                  </span>
                </div>
              )}

              <CardHeader className={recommended ? "pt-8" : ""}>
                <CardTitle className="text-2xl font-bold text-[var(--text-strong)] mb-2">
                  {plan.name}
                </CardTitle>
                <CardDescription className="plan-description">
                  {index === 0
                    ? "For small ministries getting started"
                    : index === 1
                      ? "For growing churches with more needs"
                      : "For large congregations with advanced requirements"
                  }
                </CardDescription>
              </CardHeader>

              <CardContent className="flex-1">
                <div className="mb-6">
                  <span className="text-5xl font-bold text-[var(--text-strong)]">
                    {formatPrice(price)}
                  </span>
                  <span className="text-[var(--muted)] text-base"> {period}</span>
                </div>

                <ul className="space-y-3">
                  {features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      {feature.included ? (
                        <svg
                          className="w-5 h-5 text-[var(--good)] flex-shrink-0 mt-0.5"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                          aria-hidden="true"
                        >
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg
                          className="w-5 h-5 text-[var(--muted-2)] flex-shrink-0 mt-0.5"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                          aria-hidden="true"
                        >
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 011.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      )}
                      <span className={`text-sm ${feature.included ? "text-[var(--text)]" : "text-[var(--muted-2)]"}`}>
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter>
                <Link href="/admin" className="w-full">
                  <Button
                    variant={recommended ? "default" : "outline"}
                    size="lg"
                    className="w-full"
                  >
                    {index === 0 ? "Get started free" : "Start free trial"}
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </section>
  );
}