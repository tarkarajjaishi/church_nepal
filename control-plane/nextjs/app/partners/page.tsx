"use client";

import PublicLayout from "../public-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function PartnersPage() {
  const partnerTiers = [
    {
      title: "Referral Partner",
      description: "Earn commissions by referring new churches",
      benefits: [
        "20% commission on first-year subscriptions",
        "Dedicated referral tracking dashboard",
        "Marketing materials provided",
        "Monthly performance reports"
      ],
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
          <circle cx="9" cy="7" r="4"></circle>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
        </svg>
      )
    },
    {
      title: "Reseller Partner",
      description: "Sell our platform under your brand",
      benefits: [
        "Up to 40% margin on subscriptions",
        "White-label solution available",
        "Joint marketing opportunities",
        "Technical support for your clients"
      ],
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="3" width="20" height="14" rx="2"></rect>
          <line x1="8" y1="21" x2="16" y2="21"></line>
          <line x1="12" y1="17" x2="12" y2="21"></line>
        </svg>
      )
    },
    {
      title: "Technology Partner",
      description: "Integrate with our platform and expand capabilities",
      benefits: [
        "Access to our API and documentation",
        "Co-marketing opportunities",
        "Revenue sharing models",
        "Joint customer success stories"
      ],
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="3" width="20" height="14" rx="2"></rect>
          <circle cx="8" cy="10" r="2"></circle>
          <circle cx="16" cy="10" r="2"></circle>
          <path d="M8 12h8"></path>
        </svg>
      )
    }
  ];

  // Placeholder partner logos - replace with real logos in production
  const partnerLogos = Array.from({ length: 6 }, (_, i) => (
    <div key={i} className="flex items-center justify-center h-16 bg-[var(--panel-2)] rounded-lg border border-[var(--border-soft)]">
      <span className="text-[var(--muted)] font-medium">Partner {i + 1}</span>
    </div>
  ));

  return (
    <PublicLayout>
      <div className="min-h-screen bg-[var(--bg)] py-12">
        {/* Hero Section */}
        <section className="container mx-auto px-4 max-w-4xl mb-20 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-[var(--text-strong)] mb-6">
            Partner With Us
          </h1>
          <p className="text-xl text-[var(--muted)] max-w-2xl mx-auto">
            Join our growing network of partners who share our vision of empowering churches through technology.
          </p>
        </section>

        {/* Partner Tiers */}
        <section className="container mx-auto px-4 max-w-6xl mb-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {partnerTiers.map((tier, index) => (
              <Card 
                key={index} 
                className="bg-[var(--panel)] border border-[var(--border)] rounded-xl overflow-hidden flex flex-col h-full"
              >
                <CardContent className="p-6 flex-grow flex flex-col">
                  <div className="w-12 h-12 bg-[var(--accent-soft)] rounded-lg flex items-center justify-center text-[var(--accent)] mb-4">
                    {tier.icon}
                  </div>
                  <h3 className="text-2xl font-bold text-[var(--text-strong)] mb-2">{tier.title}</h3>
                  <p className="text-[var(--muted)] mb-4 flex-grow">{tier.description}</p>
                  <ul className="space-y-2 mb-6">
                    {tier.benefits.map((benefit, idx) => (
                      <li key={idx} className="flex items-start">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 mt-0.5 text-[var(--accent)] flex-shrink-0">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                        <span className="text-[var(--text)]">{benefit}</span>
                      </li>
                    ))}
                  </ul>
                  <Button variant="outline" className="mt-auto w-full">
                    Learn More
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Partner Logos */}
        <section className="container mx-auto px-4 max-w-6xl mb-20">
          <h2 className="text-3xl font-bold text-center text-[var(--text-strong)] mb-12">
            Our Trusted Partners
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            {partnerLogos}
          </div>
        </section>

        {/* CTA Section */}
        <section className="container mx-auto px-4 max-w-4xl">
          <Card className="bg-gradient-to-r from-[var(--accent-soft)] to-[var(--accent)] rounded-2xl overflow-hidden">
            <CardContent className="p-8 md:p-12 text-center">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Ready to Become a Partner?
              </h2>
              <p className="text-[var(--accent-2)] mb-6 max-w-2xl mx-auto">
                Join our partner program today and start growing your business while helping churches thrive.
              </p>
              <Link href="/contact">
                <Button size="lg" className="bg-white text-[var(--accent)] hover:bg-gray-100">
                  Contact Us to Get Started
                </Button>
              </Link>
            </CardContent>
          </Card>
        </section>
      </div>
    </PublicLayout>
  );
}
