"use client";

import { usePlans } from "@/components/hooks/use-plans";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface PlanFeature {
  text: string;
  included: boolean;
}

// Feature labels for mapping plan features
const featureLabels: Record<string, string> = {
  own_subdomain: "Own subdomain (yourchurch.churchnepal.com)",
  isolated_database: "Isolated PostgreSQL database",
  private_storage: "Private media storage",
  headless_cms: "Headless CMS for content",
  instant_admin: "Instant admin login",
  beautiful_themes: "Beautiful themes",
  max_members: "Members",
  max_storage_mb: "Storage (MB)",
  max_emails: "Email sends",
  max_churches: "Churches",
};

function formatPrice(price: number): string {
  return new Intl.NumberFormat("en-NP", {
    style: "currency",
    currency: "NPR",
    minimumFractionDigits: 0,
  }).format(price);
}

export function PricingSection() {
  const { data: plans, isLoading, isError } = usePlans();

  // Static fallback plan data matching the use-plans structure
  const staticPlans: PlanFeature[][] = [
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
      { text: "Priority support", included: true },
      { text: "Custom domain support", included: true },
      { text: "Advanced analytics", included: true },
    ],
  ];

  // No hardcoded fallback prices.
  //
  // There used to be one - Standard 2,499 and Pro 14,999 - and because /plans
  // answers 401 to anyone not signed in, that fallback was what every visitor
  // saw. The platform bills 2,900 and 9,900, so the public price list quoted
  // figures nobody is charged, and looked entirely healthy doing it. A price is
  // the last thing that should be guessed at: if it cannot be loaded the section
  // says so instead.
  const planData = plans ?? [];

  const isRecommended = (planId: string) => planId === "standard";

  return (
    <section id="pricing" className="lp-section">
      <div className="text-center mb-[var(--space-10)]">
        <h2 className="lp-h2">Simple, transparent pricing</h2>
        <p className="lp-sub2">
          Choose the plan that fits your church's needs. All plans include core features.
        </p>
      </div>

      {/* isLoading and isError were read from usePlans and then never used, so
          with the invented fallback gone an unanswered request would have left
          a silently empty section. Both are said out loud now. */}
      {isLoading && (
        <p className="text-center text-[var(--muted)]">Loading the current prices…</p>
      )}
      {!isLoading && (isError || planData.length === 0) && (
        <p className="text-center text-[var(--muted)]">
          The price list could not be loaded just now. Please{" "}
          <a href="/contact" className="underline">get in touch</a> and we will
          confirm the current pricing — we would rather say nothing than quote
          you a figure we are not sure of.
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-[var(--max)] mx-auto">
        {planData.map((plan, index) => {
          const features = staticPlans[index] || [];
          // The annual figure, because the line underneath already said "billed
          // annually" while the number above it was a monthly one - two
          // different periods in the same breath.
          const price = plan.price_annual;
          const recommended = isRecommended(plan.id);

          return (
            <Card
              key={plan.id}
              variant={recommended ? "elevated" : "default"}
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
                <p className="text-[var(--muted)] text-sm">
                  {recommended 
                    ? "Perfect for growing churches" 
                    : index === 0 
                    ? "For small ministries" 
                    : "For large congregations"
                  }
                </p>
              </CardHeader>

              <CardContent className="flex-1">
                <div className="mb-2">
                  <span className="text-5xl font-bold text-[var(--text-strong)]">
                    {formatPrice(price)}
                  </span>
                  <span className="text-[var(--muted)] text-base"> / per year</span>
                </div>
                <div className="mb-6">
                  <span className="text-sm text-[var(--muted)]">
                    {plan.price_monthly
                      ? `${formatPrice(plan.price_monthly)} a month if paid monthly`
                      : "no charge"}
                  </span>
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
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 011.414 1.414L11.414 10l4.293-4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
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
                <Link href="/contact" className="w-full">
                  <Button 
                    variant={recommended ? "primary" : "outline"} 
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

export default PricingSection;
