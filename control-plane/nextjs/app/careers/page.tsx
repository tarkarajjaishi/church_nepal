"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import PublicLayout from "../public-layout";

const values = [
  {
    title: "Remote-first",
    description:
      "Work from anywhere. We care about output, not hours logged or where you sit.",
    icon: (
      <svg
        className="w-6 h-6"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
        <line x1="8" y1="21" x2="16" y2="21" />
        <line x1="12" y1="17" x2="12" y2="21" />
      </svg>
    ),
  },
  {
    title: "Mission-driven",
    description:
      "Everything we build serves churches and faith communities. Your work matters.",
    icon: (
      <svg
        className="w-6 h-6"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    ),
  },
  {
    title: "Growth",
    description:
      "Learn new tools, ship real products, and level up with a team that invests in you.",
    icon: (
      <svg
        className="w-6 h-6"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
        <polyline points="17 6 23 6 23 12" />
      </svg>
    ),
  },
  {
    title: "Impact",
    description:
      "Your code and design directly help churches reach more people worldwide.",
    icon: (
      <svg
        className="w-6 h-6"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
];

const positions = [
  {
    title: "Senior Frontend Engineer",
    department: "Engineering",
    location: "Remote / Kathmandu",
    type: "Full-time",
  },
  {
    title: "Backend Developer",
    department: "Engineering",
    location: "Remote / Kathmandu",
    type: "Full-time",
  },
  {
    title: "Product Designer",
    department: "Design",
    location: "Remote / Kathmandu",
    type: "Full-time",
  },
  {
    title: "DevRel Engineer",
    department: "Developer Relations",
    location: "Remote / Kathmandu",
    type: "Full-time",
  },
  {
    title: "Church Success Manager",
    department: "Customer Success",
    location: "Remote / Kathmandu",
    type: "Full-time",
  },
];

const perks = [
  {
    title: "Flexible schedule",
    description: "Work when you are most productive.",
    icon: (
      <svg
        className="w-5 h-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
  },
  {
    title: "Home office stipend",
    description: "Budget to build your ideal workspace.",
    icon: (
      <svg
        className="w-5 h-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
      </svg>
    ),
  },
  {
    title: "Learning budget",
    description: "Annual allowance for courses and conferences.",
    icon: (
      <svg
        className="w-5 h-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
      </svg>
    ),
  },
  {
    title: "Annual retreat",
    description: "Team trip once a year to reconnect in person.",
    icon: (
      <svg
        className="w-5 h-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M17.5 19c0-1.7-1.3-3-3-3h-11a4 4 0 0 1-1.5-7.7V5a2.5 2.5 0 0 1 5 0v.3a6 6 0 0 0 12 0V5a2.5 2.5 0 0 1 5 0v6.3a4 4 0 0 1-1.5 7.7h-11c-1.7 0-3 1.3-3 3z" />
      </svg>
    ),
  },
  {
    title: "Health & wellness",
    description: "Mental and physical health support included.",
    icon: (
      <svg
        className="w-5 h-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    ),
  },
  {
    title: "Parental leave",
    description: "Generous paid leave for new parents.",
    icon: (
      <svg
        className="w-5 h-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M20 7H6.5A2.5 2.5 0 0 0 4 9.5v.5" />
        <path d="M12 2v8" />
        <path d="M8 6l4-4 4 4" />
      </svg>
    ),
  },
];

export default function CareersPage() {
  return (
    <PublicLayout>
      <div className="min-h-screen bg-[var(--bg)]">
        <div className="max-w-[var(--max)] mx-auto px-6 py-16 sm:py-24 space-y-20">
          {/* Hero */}
          <section className="text-center">
            <Badge variant="secondary">Careers</Badge>
            <h1 className="mt-5 text-4xl sm:text-5xl font-bold text-[var(--text-strong)]">
              Join our mission
            </h1>
            <p className="mt-4 text-[var(--muted)] text-lg max-w-2xl mx-auto">
              Help us build the platform that gives every church its own beautiful,
              isolated home on the web.
            </p>
          </section>

          {/* Why work here */}
          <section className="space-y-8">
            <h2 className="text-3xl font-bold text-[var(--text-strong)] text-center">
              Why work here
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {values.map((value) => (
                <Card key={value.title} className="hover:border-[var(--border)] transition-colors">
                  <CardHeader>
                    <span className="text-[var(--accent)] mb-2 block" aria-hidden="true">
                      {value.icon}
                    </span>
                    <CardTitle>{value.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-[var(--muted)] text-sm leading-relaxed">
                      {value.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Open positions */}
          <section className="space-y-8">
            <h2 className="text-3xl font-bold text-[var(--text-strong)] text-center">
              Open positions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {positions.map((position) => (
                <Card key={position.title} className="flex flex-col hover:border-[var(--border)] transition-colors">
                  <CardHeader>
                    <CardTitle>{position.title}</CardTitle>
                    <p className="text-[var(--muted)] text-sm mt-1">
                      {position.department}
                    </p>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <div className="flex flex-wrap gap-2 mb-4">
                      <Badge variant="outline">{position.location}</Badge>
                      <Badge variant="outline">{position.type}</Badge>
                    </div>
                  </CardContent>
                  <div className="p-6 pt-0">
                    <Link href="/contact">
                      <Button variant="primary" className="w-full">
                        Apply
                      </Button>
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          </section>

          {/* Perks & benefits */}
          <section className="space-y-8">
            <h2 className="text-3xl font-bold text-[var(--text-strong)] text-center">
              Perks &amp; benefits
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {perks.map((perk) => (
                <div
                  key={perk.title}
                  className="flex items-start gap-3 p-4 rounded-lg border border-[var(--border-soft)] bg-[var(--panel)]"
                >
                  <span className="text-[var(--accent)] mt-0.5" aria-hidden="true">
                    {perk.icon}
                  </span>
                  <div>
                    <p className="text-[var(--text-strong)] font-medium text-sm">
                      {perk.title}
                    </p>
                    <p className="text-[var(--muted)] text-xs mt-0.5">
                      {perk.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Closing CTA */}
          <section className="text-center">
            <Card className="bg-[var(--panel-2)] p-8 sm:p-12">
              <CardContent>
                <h2 className="text-2xl font-bold text-[var(--text-strong)] mb-3">
                  Don&rsquo;t see your role?
                </h2>
                <p className="text-[var(--muted)] mb-6 max-w-xl mx-auto">
                  We are always looking for talented people who share our mission.
                  Send us your resume and let us know how you can help.
                </p>
                <Link href="/contact">
                  <Button variant="primary" size="lg">
                    Get in Touch
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
    </PublicLayout>
  );
}
