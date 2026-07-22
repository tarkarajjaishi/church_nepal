"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import PublicLayout from "../public-layout";

const components = [
  { name: "Website / Marketing", status: "Operational" },
  { name: "Admin Dashboard", status: "Operational" },
  { name: "Church Sites", status: "Operational" },
  { name: "API", status: "Degraded Performance" },
  { name: "Database", status: "Operational" },
  { name: "Media / Storage", status: "Operational" },
  { name: "Email Delivery", status: "Operational" },
];

const incidents = [
  {
    date: "2025-12-15",
    title: "Email delivery delays",
    resolution:
      "Issue resolved after fixing relay configuration. No data loss occurred.",
  },
  {
    date: "2026-02-03",
    title: "Brief API latency spike",
    resolution:
      "Resolved by scaling API workers. All endpoints restored to baseline.",
  },
];

export default function StatusPage() {
  return (
    <PublicLayout>
      <div className="min-h-screen bg-[var(--bg)]">
        <main className="max-w-[var(--max)] mx-auto px-6 py-16 sm:py-24">
          {/* Hero */}
          <section className="text-center mb-16">
            <Badge variant="secondary" className="mb-4">
              System Status
            </Badge>
            <h1 className="text-4xl sm:text-5xl font-bold text-[var(--text-strong)] mb-4">
              Status
            </h1>
            <p className="text-[var(--muted)] text-lg max-w-2xl mx-auto">
              Real-time platform health overview for ChurchNepal services.
            </p>
          </section>

          {/* Overall Status Banner */}
          <section className="mb-16">
            <div className="bg-[var(--good-soft)] text-[var(--good)] rounded-xl p-6 sm:p-8 flex items-center justify-center gap-3">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--good)] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-[var(--good)]"></span>
              </span>
              <span className="text-lg sm:text-xl font-semibold">
                All systems operational
              </span>
            </div>
          </section>

          {/* Components Grid */}
          <section className="mb-16">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {components.map((comp, index) => {
                const isDegraded = comp.status === "Degraded Performance";
                const bars = Array.from({ length: 90 }, (_, i) => {
                  if (isDegraded) return i >= 75 && i < 82;
                  return !(i >= 78 && i < 81);
                });

                return (
                  <Card
                    key={index}
                    className="lp-card hover-lift transition-all duration-300"
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <span className="font-semibold text-[var(--text-strong)]">
                          {comp.name}
                        </span>
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            isDegraded
                              ? "bg-[var(--gold-soft)] text-[var(--text)]"
                              : "bg-[var(--good-soft)] text-[var(--good)]"
                          }`}
                        >
                          {comp.status}
                        </span>
                      </div>
                      <div className="flex items-end gap-[2px] h-10">
                        {bars.map((ok, i) => (
                          <div
                            key={i}
                            title={`Day ${i + 1}: ${ok ? "Operational" : "Degraded"}`}
                            className={`flex-1 rounded-sm ${
                              ok
                                ? "bg-[var(--good)]"
                                : "bg-[var(--gold-soft)]"
                            }`}
                          />
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>

          {/* Past Incidents */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-[var(--text-strong)] mb-6">
              Past incidents
            </h2>
            <div className="space-y-4">
              {incidents.map((incident, index) => (
                <Card
                  key={index}
                  className="bg-[var(--panel)] border-[var(--border)]"
                >
                  <CardContent className="p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                      <h3 className="font-semibold text-[var(--text-strong)]">
                        {incident.title}
                      </h3>
                      <span className="text-xs text-[var(--muted)]">
                        {incident.date}
                      </span>
                    </div>
                    <p className="text-sm text-[var(--muted)]">
                      {incident.resolution}
                    </p>
                    <span className="inline-block mt-3 text-xs font-medium text-[var(--good)]">
                      Resolved
                    </span>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Closing CTA */}
          <section>
            <Card className="bg-[var(--panel-2)] border-[var(--border)] p-8 md:p-12 text-center">
              <CardContent>
                <h2 className="text-2xl font-bold mb-2 text-[var(--text-strong)]">
                  Built for reliability
                </h2>
                <p className="text-[var(--muted)] mb-6 max-w-xl mx-auto">
                  Experience a platform designed to keep your church online and
                  thriving. Get started today.
                </p>
                <div className="flex flex-wrap justify-center gap-4">
                  <Link href="/signup">
                    <Button variant="primary" size="lg">
                      Get Started
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
        </main>
      </div>
    </PublicLayout>
  );
}
