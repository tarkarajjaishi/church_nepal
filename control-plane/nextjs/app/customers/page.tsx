"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import PublicLayout from "../public-layout";

const stories = [
  {
    name: "Grace Community Church",
    location: "Kathmandu, Nepal",
    quote: "We launched our site in under a minute and immediately saw more families visiting.",
    stats: ["+35% online giving", "2.1k monthly visits"],
    initials: "GC",
  },
  {
    name: "Lighthouse Fellowship",
    location: "Pokhara, Nepal",
    quote: "The isolated database gives us peace of mind — our data stays ours.",
    stats: ["99.98% uptime", "1.8k members"],
    initials: "LF",
  },
  {
    name: "Bethel Ministries",
    location: "Lalitpur, Nepal",
    quote: "We finally have a professional web presence without hiring developers.",
    stats: ["+45% event signups", "24/7 support"],
    initials: "BM",
  },
  {
    name: "Covenant Chapel",
    location: "Biratnagar, Nepal",
    quote: "ChurchNepal made discipleship tools accessible to our remote congregation.",
    stats: ["+30% small-group joins", "960 active members"],
    initials: "CC",
  },
  {
    name: "Redeemer House",
    location: "Bhaktapur, Nepal",
    quote: "Our sermon archive has never been easier to manage or more reliable.",
    stats: ["+40% media downloads", "1.4k weekly visitors"],
    initials: "RH",
  },
  {
    name: "Hope River Church",
    location: "Chitwan, Nepal",
    quote: "The platform's ease of use lets our volunteers keep everything current.",
    stats: ["+25% volunteer signups", "Zero downtime"],
    initials: "HR",
  },
];

const metrics = [
  { value: "500+", label: "churches" },
  { value: "1M+", label: "members served" },
  { value: "99.9%", label: "uptime" },
  { value: "24/7", label: "support" },
];

export default function CustomersPage() {
  return (
    <PublicLayout>
      <div className="max-w-[var(--max)] mx-auto px-6 py-16 sm:py-24">
        <section className="text-center mb-16 sm:mb-24">
          <Badge variant="secondary" className="mb-4">
            Case Studies
          </Badge>
          <h1 className="text-4xl sm:text-5xl font-bold text-[var(--text-strong)] mb-4">
            Churches thriving on ChurchNepal
          </h1>
          <p className="text-[var(--muted)] text-lg max-w-2xl mx-auto">
            Real stories from real churches using ChurchNepal to grow their ministry
            and connect with their communities.
          </p>
        </section>

        <section className="mb-16 sm:mb-24">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {metrics.map((metric) => (
              <div
                key={metric.label}
                className="rounded-lg border border-[var(--border)] bg-[var(--panel)] p-6 text-center"
              >
                <div className="text-3xl font-bold text-[var(--text-strong)] mb-1">
                  {metric.value}
                </div>
                <div className="text-sm text-[var(--muted)]">{metric.label}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-16 sm:mb-24">
          <h2 className="text-3xl font-bold text-[var(--text-strong)] text-center mb-10">
            Customer Stories
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stories.map((story, i) => (
              <Card key={i} className="hover-lift transition-all duration-300 h-full">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[var(--accent-soft)] flex items-center justify-center text-[var(--accent)] font-bold text-sm">
                      {story.initials}
                    </div>
                    <div>
                      <CardTitle className="text-base">{story.name}</CardTitle>
                      <CardDescription className="text-xs">{story.location}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-[var(--muted)] mb-4 italic">"{story.quote}"</p>
                  <div className="flex flex-wrap gap-2">
                    {story.stats.map((stat) => (
                      <Badge key={stat} variant="secondary">{stat}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="mb-16 sm:mb-24">
          <Card className="bg-[var(--panel-2)] border-[var(--border)] p-8 md:p-12 text-center">
            <CardContent>
              <svg
                className="w-10 h-10 text-[var(--accent)] mx-auto mb-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M7.5 8.25v-1.5a2.25 2.25 0 012.25-2.25h1.5M7.5 8.25h6a2.25 2.25 0 012.25 2.25v6"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.5 8.25v-1.5a2.25 2.25 0 012.25-2.25h1.5M16.5 8.25H21a2.25 2.25 0 012.25 2.25v6a2.25 2.25 0 01-2.25 2.25h-1.5"
                />
              </svg>
              <blockquote className="text-xl md:text-2xl font-medium text-[var(--text-strong)] mb-6 leading-relaxed italic">
                ChurchNepal transformed our digital presence. What used to take months now takes
                minutes, and the results speak for themselves — our congregation is more engaged
                than ever.
              </blockquote>
              <p className="text-[var(--muted)] font-semibold">Pastor Rajesh Sharma</p>
              <p className="text-[var(--muted)] text-sm">Grace Community Church, Kathmandu</p>
            </CardContent>
          </Card>
        </section>

        <section>
          <div className="lp-cta">
            <h2 className="text-2xl font-bold mb-2 text-[var(--text-strong)]">
              Ready to write your success story?
            </h2>
            <p className="lp-body mb-6 text-[var(--muted)]">
              Join hundreds of churches already thriving on ChurchNepal.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/signup">
                <Button variant="default" size="lg">
                  Get Started
                </Button>
              </Link>
              <Link href="/pricing">
                <Button variant="outline" size="lg">
                  View Pricing
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </PublicLayout>
  );
}
