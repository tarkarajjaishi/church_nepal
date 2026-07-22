"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import PublicLayout from "../public-layout";

const securityPractices = [
  {
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className="w-6 h-6"
      >
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
    title: "Per-church data isolation",
    description:
      "Each church operates in its own dedicated database environment, ensuring complete separation and privacy of data across all tenants.",
  },
  {
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className="w-6 h-6"
      >
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
    ),
    title: "Encryption in transit & at rest",
    description:
      "All data is encrypted using industry-standard protocols both while being transmitted and when stored on our servers.",
  },
  {
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className="w-6 h-6"
      >
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
    title: "Role-based access control",
    description:
      "Granular permissions ensure that every team member only accesses the features and data necessary for their role.",
  },
  {
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className="w-6 h-6"
      >
        <polyline points="23 4 23 10 17 10" />
        <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
      </svg>
    ),
    title: "Automated backups",
    description:
      "Continuous, automated backups with point-in-time recovery ensure your church data is always safe and restorable.",
  },
  {
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className="w-6 h-6"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>
    ),
    title: "DDoS protection & WAF",
    description:
      "Enterprise-grade DDoS mitigation and Web Application Firewall keep your church's online presence available and secure.",
  },
  {
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className="w-6 h-6"
      >
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
        <polyline points="17 6 23 6 23 12" />
      </svg>
    ),
    title: "Regular security updates",
    description:
      "Dependencies and infrastructure are continuously patched and updated to protect against emerging vulnerabilities.",
  },
  {
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className="w-6 h-6"
      >
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="M9 12l2 2 4-4" />
      </svg>
    ),
    title: "GDPR-friendly data handling",
    description:
      "We follow privacy-by-design principles, giving churches full control over data retention, deletion, and portability.",
  },
  {
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className="w-6 h-6"
      >
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    ),
    title: "Audit logging",
    description:
      "Comprehensive, tamper-proof audit trails record all administrative actions for accountability and compliance reviews.",
  },
];

const complianceBadges = ["SSL", "TLS 1.3", "Daily Backups", "Uptime 99.9%"];

export default function SecurityPage() {
  return (
    <PublicLayout>
      <div className="min-h-screen bg-[var(--bg)]">
        <main className="max-w-[var(--max)] mx-auto px-6 py-16 sm:py-24">
          {/* Hero */}
          <section className="text-center mb-16">
            <Badge variant="secondary" className="mb-4">
              Security & Trust
            </Badge>
            <h1 className="text-4xl sm:text-5xl font-bold text-[var(--text-strong)] mb-4">
              Security &amp; Trust
            </h1>
            <p className="text-[var(--muted)] text-lg max-w-2xl mx-auto">
              Your church&rsquo;s data is protected by enterprise-grade security
              practices and a commitment to transparency. We take your trust
              seriously.
            </p>
          </section>

          {/* Security Practices Grid */}
          <section className="mb-16">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {securityPractices.map((practice, index) => (
                <Card
                  key={index}
                  className="lp-card hover-lift transition-all duration-300"
                >
                  <CardHeader>
                    <span
                      className="lp-feature-icon mb-3 inline-flex items-center justify-center"
                      aria-hidden="true"
                    >
                      {practice.icon}
                    </span>
                    <CardTitle className="text-lg">
                      {practice.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-[var(--muted)] leading-relaxed">
                      {practice.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Compliance & Standards Strip */}
          <section className="mb-16">
            <h2 className="lp-h2 mb-6 text-center">
              Compliance &amp; standards
            </h2>
            <p className="lp-sub2 mb-8">
              Our infrastructure meets and exceeds industry benchmarks.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              {complianceBadges.map((badge, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[var(--border)] bg-[var(--panel-2)] text-sm font-medium text-[var(--text)] transition-colors hover:border-[var(--accent)] hover:bg-[var(--accent-soft)]"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                    className="w-4 h-4 text-[var(--good)]"
                  >
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                  {badge}
                </span>
              ))}
            </div>
          </section>

          {/* Responsible Disclosure */}
          <section className="mb-16">
            <Card className="bg-[var(--panel)] border-[var(--border)] max-w-2xl mx-auto">
              <CardHeader className="text-center">
                <CardTitle className="text-xl">Responsible disclosure</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-[var(--muted)] mb-4">
                  We welcome security researchers and church administrators to
                  responsibly disclose any potential vulnerabilities. We are
                  committed to addressing security concerns promptly and
                  transparently.
                </p>
                <Link
                  href="mailto:security@churchnepal.com"
                  className="text-[var(--accent)] font-medium hover:underline"
                >
                  security@churchnepal.com
                </Link>
              </CardContent>
            </Card>
          </section>

          {/* Closing CTA */}
          <section className="section-wrapper-sm">
            <div className="lp-cta text-center">
              <h2 className="text-2xl font-bold mb-2 text-[var(--text-strong)]">
                Talk to us about security
              </h2>
              <p className="lp-body mb-6 text-[var(--muted)]">
                Have questions about our security practices or want to discuss
                your church&rsquo;s specific requirements? We&rsquo;re here to
                help.
              </p>
              <Link href="/contact">
                <Button variant="primary" size="lg">
                  Get in Touch
                </Button>
              </Link>
            </div>
          </section>
        </main>
      </div>
    </PublicLayout>
  );
}
