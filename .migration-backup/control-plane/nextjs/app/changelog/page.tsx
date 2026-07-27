"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import PublicLayout from "../public-layout";

const releases = [
  {
    version: "v2.0.0",
    date: "July 15, 2026",
    title: "Language Switcher & Theme Customizer",
    description:
      "This release brings a fully redesigned language switcher with auto-detection and persistent preferences across sessions. We also shipped a new theme customizer that lets admins pick accent colors and typography, live-previews across public pages, and exports settings per church.",
    changes: [
      { type: "New", text: "Multi-language switcher with auto-detect and override" },
      { type: "New", text: "Theme customizer with accent colors and fonts" },
      { type: "Improved", text: "Editor now supports right-to-left languages" },
      { type: "Fixed", text: "Theme tokens not applying in generated blog detail pages" },
    ],
  },
  {
    version: "v1.9.0",
    date: "May 28, 2026",
    title: "Admin Notifications & Audit Log",
    description:
      "A real-time notification center for admins replaced broad polling, including threaded comments on blog posts and sermon drafts. We also launched a global audit log with filter by actor, action, and resource, plus CSV export.",
    changes: [
      { type: "New", text: "Real-time admin notification bell" },
      { type: "New", text: "Audit log with CSV export and date filtering" },
      { type: "New", text: "Threaded comments on blog and sermon drafts" },
      { type: "Improved", text: "Notification batching reduces email noise" },
      { type: "Fixed", text: "Late audit entries missing resource IDs" },
    ],
  },
  {
    version: "v1.8.0",
    date: "March 12, 2026",
    title: "Giving Reports & Billing Renewals",
    description:
      "Churches can now download monthly giving summaries by fund, filter by member segment, and reconcile with bank exports. On billing, annual plan renewals now send 30/7/1-day reminders and support seat upgrades mid-cycle.",
    changes: [
      { type: "New", text: "Monthly giving reports by fund and segment" },
      { type: "New", text: "Bank reconciliation export (CSV/OFX)" },
      { type: "New", text: "Billing renewal reminders at 30, 7, and 1 day" },
      { type: "Improved", text: "Invoice PDFs now include payment method" },
      { type: "Fixed", text: "Tax exemption checkbox not persisting on checkout" },
    ],
  },
  {
    version: "v1.7.0",
    date: "January 5, 2026",
    title: "Blog Detail Pages & Media Library",
    description:
      "We introduced per-post rich text editors, featured images, and reading-time estimates. The media library now supports folders, bulk delete, and alt-text editing, while public blog pages gained structured metadata for SEO.",
    changes: [
      { type: "New", text: "Rich text editor with markdown shortcuts" },
      { type: "New", text: "Media library with folders and bulk actions" },
      { type: "New", text: "Structured metadata for blog SEO" },
      { type: "Improved", text: "Image upload size increased to 20 MB" },
      { type: "Fixed", text: "Drafts auto-saving to wrong church ID" },
    ],
  },
  {
    version: "v1.6.0",
    date: "November 18, 2025",
    title: "Member Enrollment & SMS Reminders",
    description:
      "Admins can now invite members by SMS and email with auto-expiring enrollment links. We also added attendance reminders, a new member portal home, and confirmation email templates for scheduled events.",
    changes: [
      { type: "New", text: "SMS enrollment invites with expiration" },
      { type: "New", text: "Attendance reminder scheduling" },
      { type: "New", text: "Member portal dashboard" },
      { type: "Improved", text: "Email template editor with live preview" },
      { type: "Fixed", text: "Duplicate enrollment tokens on retry" },
    ],
  },
  {
    version: "v1.5.0",
    date: "September 2, 2025",
    title: "Public Launch & Billing Plans",
    description:
      "The first public release of ChurchNepal introduced tenant isolation, basic membership management, sermon uploads, and three billing tiers. A self-service checkout flow was included along with the initial landing page and admin panel.",
    changes: [
      { type: "New", text: "Tenant isolation with per-church databases" },
      { type: "New", text: "Sermon upload with audio and PDF support" },
      { type: "New", text: "Three billing tiers with self-service checkout" },
      { type: "Improved", text: "Admin dashboard layout and navigation" },
    ],
  },
];

const changeTypeClasses: Record<string, string> = {
  New: "bg-[var(--good-soft)] text-[var(--good)]",
  Improved: "bg-[var(--accent-soft)] text-[var(--accent)]",
  Fixed: "bg-[var(--panel-2)] text-[var(--muted)]",
};

export default function ChangelogPage() {
  return (
    <PublicLayout>
      <div className="min-h-screen bg-[var(--bg)]">
        <div className="max-w-[var(--max)] mx-auto px-6 py-16 sm:py-24">
          {/* Hero */}
          <section className="text-center mb-16 sm:mb-24">
            <Badge variant="secondary" className="mb-4">
              What&apos;s New
            </Badge>
            <h1 className="text-4xl sm:text-5xl font-bold text-[var(--text-strong)] mb-4">
              Changelog
            </h1>
            <p className="text-[var(--muted)] text-lg max-w-2xl mx-auto">
              Track every improvement, fix, and feature shipped to ChurchNepal.
            </p>
          </section>

          {/* Timeline */}
          <section aria-label="Release timeline">
            <ol className="relative border-s border-[var(--border)] ms-3 sm:ms-5 space-y-10 sm:space-y-12">
              {releases.map((release) => (
                <li key={release.version} className="ms-8 sm:ms-10">
                  <span className="absolute -start-[0.65rem] sm:-start-[0.85rem] flex h-4 w-4 items-center justify-center rounded-full border-2 border-[var(--accent)] bg-[var(--bg)]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" aria-hidden="true" />
                  </span>
                  <Card className="bg-[var(--panel)] border-[var(--border)]">
                    <CardContent className="p-6 sm:p-8">
                      <div className="flex flex-wrap items-center gap-3 mb-3">
                        <span className="font-mono text-sm font-semibold text-[var(--accent)]">
                          {release.version}
                        </span>
                        <span className="text-xs text-[var(--muted)]">{release.date}</span>
                      </div>
                      <h2 className="text-xl sm:text-2xl font-semibold text-[var(--text-strong)] mb-3">
                        {release.title}
                      </h2>
                      <p className="text-[var(--text)] mb-5 leading-relaxed">
                        {release.description}
                      </p>
                      <ul className="space-y-2">
                        {release.changes.map((change, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span
                              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold shrink-0 ${
                                changeTypeClasses[change.type] ?? "bg-[var(--panel-2)] text-[var(--muted)]"
                              }`}
                            >
                              {change.type}
                            </span>
                            <span className="text-sm text-[var(--text)]">{change.text}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </li>
              ))}
            </ol>
          </section>

          {/* Closing CTA */}
          <section className="mt-16 sm:mt-24">
            <Card className="bg-[var(--panel)] border-[var(--border)] text-center">
              <CardContent className="p-8 sm:p-12">
                <h2 className="text-2xl sm:text-3xl font-bold text-[var(--text-strong)] mb-3">
                  Ready to experience ChurchNepal?
                </h2>
                <p className="text-[var(--muted)] mb-8 max-w-xl mx-auto">
                  Join hundreds of churches already using our platform to grow, connect, and serve.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <Link href="/signup">
                    <Button variant="primary" size="lg">
                      Get Started
                    </Button>
                  </Link>
                  <Link href="/pricing">
                    <Button variant="outline" size="lg">
                      View Plans
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
    </PublicLayout>
  );
}
