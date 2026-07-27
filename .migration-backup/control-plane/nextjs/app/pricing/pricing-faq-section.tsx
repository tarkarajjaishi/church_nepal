"use client";

import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";

interface PricingFAQItem {
  id: string;
  question: string;
  answer: string;
}

const pricingFaqs: PricingFAQItem[] = [
  {
    id: "free-trial",
    question: "How does the free trial work?",
    answer: "All paid plans come with a 14-day free trial. No credit card is required to start. You'll get full access to all features during the trial period, and you can cancel anytime before it ends without being charged.",
  },
  {
    id: "billing-cycle",
    question: "Can I change my billing cycle?",
    answer: "Yes, you can switch between monthly and annual billing at any time from your billing settings. Annual billing saves you up to 20% compared to monthly payments.",
  },
  {
    id: "upgrade-downgrade",
    question: "Can I upgrade or downgrade my plan?",
    answer: "You can upgrade your plan at any time and the change takes effect immediately. Downgrades take effect at the end of your current billing period. We'll prorate any price differences.",
  },
  {
    id: "cancel",
    question: "What happens if I cancel my subscription?",
    answer: "If you cancel, your plan remains active until the end of your billing period. After that, your church sites will be suspended but your data will be preserved for 30 days in case you decide to return.",
  },
  {
    id: "payment-methods",
    question: "What payment methods do you accept?",
    answer: "We accept all major credit cards (Visa, Mastercard, American Express) as well as bank transfers for annual plans. All payments are processed securely through our payment provider.",
  },
  {
    id: "nonprofit",
    question: "Do you offer discounts for nonprofits?",
    answer: "Yes! We offer a 20% discount for registered nonprofits and religious organizations. Contact our support team with your registration details to apply the discount.",
  },
];

export default function PricingFaqSection() {
  const [openId, setOpenId] = useState<string | null>(null);
  const contentRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const handleToggle = (id: string) => {
    setOpenId(openId === id ? null : id);
  };

  // Close accordion when clicking outside or pressing Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpenId(null);
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  return (
    <section className="section-wrapper-lg">
      <div className="max-w-[var(--max)] mx-auto">
        {/* Section Header */}
        <div className="text-center mb-[var(--space-10)]">
          <h2 className="pricing-title">Pricing questions</h2>
          <p className="pricing-subtitle">
            Everything you need to know about our pricing
          </p>
        </div>

        {/* FAQ Accordion */}
        <div className="max-w-3xl mx-auto space-y-3">
          {pricingFaqs.map((faq, index) => {
            const isOpen = openId === faq.id;

            return (
              <Card
                key={faq.id}
                className="overflow-hidden transition-all duration-[var(--dur)]"
              >
                <h3>
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={`faq-content-${faq.id}`}
                    onClick={() => handleToggle(faq.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleToggle(faq.id);
                      }
                      // Arrow key navigation
                      if (e.key === "ArrowDown" && index < pricingFaqs.length - 1) {
                        e.preventDefault();
                        setOpenId(pricingFaqs[index + 1].id);
                      }
                      if (e.key === "ArrowUp" && index > 0) {
                        e.preventDefault();
                        setOpenId(pricingFaqs[index - 1].id);
                      }
                    }}
                    className="
                      w-full flex items-center justify-between gap-4 p-6 text-left
                      hover:bg-[var(--panel-2)] transition-colors
                      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2
                    "
                  >
                    <span className="font-semibold text-[var(--text-strong)]">
                      {faq.question}
                    </span>
                    <svg
                      className={`
                        w-5 h-5 text-[var(--muted)] transition-transform duration-[var(--dur)]
                        ${isOpen ? "rotate-180" : ""}
                      `}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>
                </h3>

                {/* Expandable Content */}
                <div
                  id={`faq-content-${faq.id}`}
                  ref={(el) => {
                    contentRefs.current[faq.id] = el;
                  }}
                  className={`
                    overflow-hidden transition-all duration-[var(--dur-slow)]
                    ${isOpen ? "max-h-96" : "max-h-0"}
                  `}
                  aria-hidden={!isOpen}
                >
                  <div className="px-6 pb-6">
                    <p className="text-[var(--muted)] leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}