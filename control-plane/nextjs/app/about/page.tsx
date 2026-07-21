"use client";

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import PublicLayout from "../public-layout";

interface Value {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const coreValues: Value[] = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <circle cx="12" cy="12" r="4" />
        <path d="M12 1v2" />
        <path d="M12 21v2" />
        <path d="M4.22 4.22l1.42 1.42" />
        <path d="M18.36 18.36l1.42 1.42" />
      </svg>
    ),
    title: "Data Isolation",
    description: "Each church gets its own isolated database and storage, ensuring complete data privacy and security.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M13 2L3 14h9l-2 8L21 10h-9l2-8z" />
      </svg>
    ),
    title: "Instant Provisioning",
    description: "One click creates your subdomain, database, storage, and admin login — ready in seconds.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <polyline points="21 15 21 19 3 19 3 7 7 3" />
      </svg>
    ),
    title: "Beautiful by Default",
    description: "Modern, responsive designs that look stunning on every device, crafted specifically for church needs.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
    title: "Built for Churches",
    description: "Every feature is designed with deep understanding of how churches work, from sermons to small groups.",
  },
];

export default function AboutPage() {
  return (
    <PublicLayout>
      <div className="min-h-screen bg-[var(--bg)]">
        <main className="max-w-[var(--max)] mx-auto">
          {/* Hero Section */}
          <section className="section-wrapper-lg text-center">
            <h1 className="lp-h1 mb-6">About ChurchNepal</h1>
            <p className="lp-lead max-w-2xl mx-auto mb-8 text-[var(--muted)]">
              Building digital homes for churches worldwide — one platform, many churches,
              fully isolated and beautifully designed.
            </p>
          </section>

          {/* Our Story Section */}
          <section className="section-wrapper">
            <div className="card bg-[var(--panel)] p-8 md:p-12 mb-12">
              <h2 className="lp-h2 mb-6 text-center">Our Story</h2>
              <div className="max-w-3xl mx-auto">
                <p className="lp-body mb-6">
                  ChurchNepal was founded in 2023 by Tarka Raj Jaishi after recognizing a critical gap:
                  churches needed professional websites but lacked the technical expertise, budget, and
                  time to build them from scratch. What began as a small project to serve local churches
                  has grown into a comprehensive platform serving communities across Nepal and beyond.
                </p>
                <p className="lp-body mb-6">
                  Our multi-tenant architecture ensures every church gets their own isolated space —
                  dedicated database, private storage, and custom subdomain — while sharing the benefits
                  of a unified, professionally-maintained platform. This unique approach gives churches
                  enterprise-grade infrastructure without enterprise-grade complexity or cost.
                </p>
                <p className="lp-body">
                  Today, ChurchNepal powers websites for churches of all sizes, from small rural
                  congregations to large urban ministries, helping them focus on what matters most:
                  their mission and community.
                </p>
              </div>
            </div>
          </section>

          {/* Mission Statement */}
          <section className="section-wrapper">
            <div className="card bg-[var(--panel)] p-8 md:p-12 mb-12">
              <h2 className="lp-h2 mb-6 text-center">Our Mission</h2>
              <p className="lp-body max-w-3xl mx-auto text-center">
                Every church deserves a beautiful, professional online presence without the technical
                complexity. We democratize website creation for religious organizations, making it
                possible for any church to launch a stunning website in minutes — not months.
              </p>
            </div>
          </section>

          {/* Core Values Grid */}
          <section className="section-wrapper">
            <h2 className="lp-h2 mb-8 text-center">Core Values</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {coreValues.map((value, index) => (
                <Card key={index} className="lp-card hover-lift transition-all duration-300">
                  <CardHeader className="text-center">
                    <span className="lp-feature-icon mb-3" aria-hidden="true">
                      {value.icon}
                    </span>
                    <CardTitle className="text-lg">{value.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-center">
                      {value.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Founder Note */}
          <section className="section-wrapper">
            <div className="card bg-[var(--panel)] p-8 md:p-12">
              <div className="max-w-3xl mx-auto text-center">
                <div className="w-20 h-20 rounded-full bg-[var(--accent-soft)] mx-auto mb-6 flex items-center justify-center">
                  <svg className="w-10 h-10 text-[var(--accent)]" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.75v14.5M5.75 12h12.5" />
                  </svg>
                </div>
                <blockquote className="lp-body italic mb-6">
                  Founded by Tarka Raj Jaishi, ChurchNepal combines years of development experience
                  with a passion for serving the church community. Our platform is built with love,
                  prayer, and the needs of churches in mind — helping ministries focus on their calling
                  while we handle the technology.
                </blockquote>
                <p className="text-[var(--muted)] font-semibold">
                  — Tarka Raj Jaishi, Founder & Developer
                </p>
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="section-wrapper-sm">
            <div className="lp-cta">
              <h2 className="text-2xl font-bold mb-2 text-[var(--text-strong)]">
                Ready to launch your church's website?
              </h2>
              <p className="lp-body mb-6 text-[var(--muted)]">
                Join hundreds of churches already using ChurchNepal to strengthen their online presence.
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