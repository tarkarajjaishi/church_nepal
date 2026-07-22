"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import PublicLayout from "../public-layout";

interface Category {
  icon: React.ReactNode;
  title: string;
  description: string;
  links: string[];
}

const categories: Category[] = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      </svg>
    ),
    title: "Getting Started",
    description: "Learn the basics of setting up and launching your church website with ChurchNepal.",
    links: ["Quick start guide", "System requirements", "Creating your account", "Building your first site"],
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
    title: "Managing Churches",
    description: "Configure settings, domains, and manage multiple church instances from one dashboard.",
    links: ["Church settings", "Domain setup", "Team roles", "Multi-site config"],
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="13.5" cy="6.5" r="0.5" fill="currentColor" />
        <circle cx="17.5" cy="10.5" r="0.5" fill="currentColor" />
        <circle cx="8.5" cy="7.5" r="0.5" fill="currentColor" />
        <circle cx="6.5" cy="12.5" r="0.5" fill="currentColor" />
        <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.93 0 1.82-.13 2.67-.37" />
        <path d="M16 14l4-2v4l-4 2" />
        <path d="M22 12c0 1.1-.9 2-2 2h-1" />
      </svg>
    ),
    title: "Themes & Design",
    description: "Customize the look and feel of your church website with themes, colors, and layouts.",
    links: ["Theme gallery", "Custom branding", "Color palette", "Typography"],
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    title: "Members & Groups",
    description: "Manage your congregation, create groups, and streamline member communication.",
    links: ["Member directory", "Group management", "Communication tools", "Privacy settings"],
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    ),
    title: "Giving & Donations",
    description: "Set up online giving, manage donations, and view giving reports and analytics.",
    links: ["Online giving setup", "Donation reports", "Payment gateways", "Tax receipts"],
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
    title: "Events & Calendar",
    description: "Create and promote church events, manage RSVPs, and embed calendars.",
    links: ["Creating events", "Calendar embeddings", "RSVP management", "Reminders"],
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polygon points="23 7 16 12 23 17 23 7" />
        <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
      </svg>
    ),
    title: "Sermons & Media",
    description: "Upload sermon videos, audio recordings, and manage your media library.",
    links: ["Uploading media", "Video player setup", "Podcast feed", "Media organization"],
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
    title: "Account & Billing",
    description: "Handle account preferences, subscriptions, invoices, and admin controls.",
    links: ["Account settings", "Billing & invoices", "Plan changes", "User permissions"],
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
      </svg>
    ),
    title: "API & Integrations",
    description: "Connect ChurchNepal with third-party tools using our REST API and webhooks.",
    links: ["API overview", "Authentication", "Webhooks", "Third-party integrations"],
  },
];

const popularArticles = [
  "How do I connect my custom domain?",
  "Setting up online giving for the first time",
  "How to add and manage church members",
  "Creating your first sermon series page",
  "Multi-site church setup guide",
  "Understanding your plan limits",
];

export default function DocsPage() {
  return (
    <PublicLayout>
      <div className="max-w-[var(--max)] mx-auto px-6 py-16 sm:py-24">
        {/* Hero Section */}
        <section className="text-center mb-16 sm:mb-24">
          <Badge variant="secondary" className="mb-4">Documentation</Badge>
          <h1 className="text-4xl sm:text-5xl font-bold text-[var(--text-strong)] mb-4">
            Help Center
          </h1>
          <p className="text-[var(--muted)] text-lg max-w-2xl mx-auto mb-8">
            Everything you need to build, manage, and grow your church website.
            Browse guides, articles, and resources below.
          </p>

          {/* Search box */}
          <div className="max-w-xl mx-auto">
            <div className="relative">
              <input
                type="text"
                placeholder="Search the docs..."
                className="w-full px-4 py-3 pl-12 rounded-lg bg-[var(--panel)] border border-[var(--border)] text-[var(--text)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
              />
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--muted)]" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" aria-hidden="true">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
            </div>
          </div>
        </section>

        {/* Categories Grid */}
        <section className="mb-16 sm:mb-24" aria-label="Documentation categories">
          <h2 className="text-2xl font-bold text-[var(--text-strong)] mb-8">Browse by topic</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category) => (
              <Card key={category.title} className="lp-card h-full flex flex-col">
                <CardContent className="p-6 flex flex-col h-full">
                  <div className="w-12 h-12 rounded-lg bg-[var(--accent-soft)] flex items-center justify-center text-[var(--accent)] mb-4">
                    {category.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-[var(--text-strong)] mb-2">
                    {category.title}
                  </h3>
                  <p className="text-[var(--muted)] text-sm mb-4 flex-1">
                    {category.description}
                  </p>
                  <ul className="space-y-2">
                    {category.links.map((link) => (
                      <li key={link}>
                        <Link
                          href="#"
                          className="text-sm text-[var(--accent)] hover:underline"
                        >
                          {link}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Popular Articles */}
        <section className="mb-16 sm:mb-24" aria-label="Popular articles">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              <h2 className="text-2xl font-bold text-[var(--text-strong)] mb-2">Popular articles</h2>
              <p className="text-[var(--muted)]">
                The most-read resources from our community.
              </p>
            </div>
            <div className="lg:col-span-2">
              <Card className="lp-card">
                <CardContent className="p-0">
                  <ul className="divide-y divide-[var(--border)]">
                    {popularArticles.map((article, index) => (
                      <li key={article}>
                        <Link
                          href="#"
                          className="flex items-center gap-4 px-6 py-4 group hover:bg-[var(--panel-2)] transition-colors"
                        >
                          <span className="text-sm font-medium text-[var(--muted)] w-6 text-right">
                            {String(index + 1).padStart(2, "0")}
                          </span>
                          <span className="text-[var(--text)] group-hover:text-[var(--accent)] transition-colors">
                            {article}
                          </span>
                          <svg className="w-4 h-4 text-[var(--muted)] ml-auto group-hover:text-[var(--accent)] transition-colors" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                          </svg>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Still need help? CTA */}
        <section className="mb-16 sm:mb-24" aria-label="Still need help">
          <Card className="lp-card bg-[var(--panel-2)]">
            <CardContent className="p-8 text-center">
              <h2 className="text-2xl font-bold text-[var(--text-strong)] mb-2">Still need help?</h2>
              <p className="text-[var(--muted)] mb-6 max-w-xl mx-auto">
                Can't find what you're looking for? Our support team is ready to assist you with any questions or issues.
              </p>
              <Link href="/contact">
                <Button variant="primary" size="lg">
                  Contact Support
                </Button>
              </Link>
            </CardContent>
          </Card>
        </section>

        {/* Closing CTA */}
        <section aria-label="Get started">
          <Card className="lp-card text-center">
            <CardContent className="p-8 sm:p-12">
              <h2 className="text-2xl sm:text-3xl font-bold text-[var(--text-strong)] mb-4">
                Ready to get started?
              </h2>
              <p className="text-[var(--muted)] text-lg mb-8 max-w-2xl mx-auto">
                Join hundreds of churches already using ChurchNepal to strengthen their online presence.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/signup">
                  <Button variant="primary" size="lg">
                    Start Free Trial
                  </Button>
                </Link>
                <Link href="/pricing">
                  <Button variant="outline" size="lg">
                    View Pricing
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </PublicLayout>
  );
}
