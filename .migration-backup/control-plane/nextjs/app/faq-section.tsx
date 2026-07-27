"use client";

import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";

interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

const faqs: FAQItem[] = [
  {
    id: "isolation",
    question: "How is data isolated between churches?",
    answer: "Each church gets its own dedicated PostgreSQL database instance and separate media storage. There is zero data crossover between churches — members, giving records, content, and files are completely siloed. Your church's data stays private and secure.",
  },
  {
    id: "custom-domains",
    question: "Can I use my own custom domain?",
    answer: "Yes! Starting with the Pro plan, you can connect your own domain (e.g., yourchurch.org) to replace the default subdomain. We provide clear DNS setup instructions and automatic HTTPS certificates via Let's Encrypt.",
  },
  {
    id: "migration",
    question: "Can I migrate existing church data?",
    answer: "Absolutely. We provide migration tools and support to help you move member lists, giving history, and content from your existing systems. Contact our support team for personalized migration assistance.",
  },
  {
    id: "pricing",
    question: "What is the pricing structure?",
    answer: "We offer three simple plans: Free (for small ministries), Standard (growing churches), and Pro (large congregations). All plans include core features with differences in member limits, storage, and advanced capabilities like custom domains. See our pricing section for full details.",
  },
  {
    id: "editing",
    question: "Who can edit the church website?",
    answer: "Each church gets an auto-generated admin account upon creation. From there, admins can invite additional team members with custom permission levels. All content is editable through our intuitive headless CMS interface — no coding required.",
  },
  {
    id: "support",
    question: "What kind of support is available?",
    answer: "All plans include email support with standard response times. Paid plans receive priority support. We also maintain documentation, video tutorials, and host periodic webinars. For urgent issues, Pro customers have access to phone support.",
  },
  {
    id: "launch-time",
    question: "How long does it take to launch a church site?",
    answer: "From the moment you enter your church name to having a fully functional website is typically under 5 minutes. Our automated provisioning system handles database setup, storage allocation, and admin account creation instantly.",
  },
  {
    id: "themes",
    question: "Can I customize the website design?",
    answer: "Every church gets professionally designed themes that look great on all devices out of the box. Pro customers can customize colors, fonts, and layout options to match their brand identity. We're constantly adding new theme options.",
  },
];

export default function FAQSection() {
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
    <section id="faq" className="lp-section">
      <div className="max-w-[var(--max)] mx-auto">
        {/* Section Header */}
        <div className="text-center mb-[var(--space-10)]">
          <h2 className="lp-h2">Frequently asked questions</h2>
          <p className="lp-sub2">
            Everything you need to know about ChurchNepal
          </p>
        </div>

        {/* FAQ Accordion */}
        <div className="max-w-3xl mx-auto space-y-3">
          {faqs.map((faq, index) => {
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
                      if (e.key === "ArrowDown" && index < faqs.length - 1) {
                        e.preventDefault();
                        setOpenId(faqs[index + 1].id);
                      }
                      if (e.key === "ArrowUp" && index > 0) {
                        e.preventDefault();
                        setOpenId(faqs[index - 1].id);
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