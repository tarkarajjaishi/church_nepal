"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/lib/api-client";
import PublicLayout from "../public-layout";

interface StatusComponent {
  name: string;
  status: string;
}

interface StatusIncident {
  id: string;
  date: string;
  title: string;
  resolution: string;
  status: string;
}

interface StatusResponse {
  status: string;
  updated_at: string;
  components: StatusComponent[];
  incidents: StatusIncident[];
}

export default function StatusPage() {
  const [data, setData] = useState<StatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    apiClient
      .get<StatusResponse>("/status")
      .then((res) => {
        setData(res.data);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, []);

  const overallColor = (s: string) => {
    if (s === "operational") return "var(--good)";
    if (s === "degraded") return "var(--gold)";
    return "var(--red)";
  };

  const overallBg = (s: string) => {
    if (s === "operational") return "var(--good-soft)";
    if (s === "degraded") return "var(--gold-soft)";
    return "var(--red-soft)";
  };

  const overallLabel = (s: string) => {
    if (s === "operational") return "All systems operational";
    if (s === "degraded") return "Some systems experiencing issues";
    return "Some systems are down";
  };

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
            {loading ? (
              <div className="bg-[var(--panel)] text-[var(--muted)] rounded-xl p-6 sm:p-8 flex items-center justify-center gap-3">
                <span className="animate-pulse text-lg">Loading status...</span>
              </div>
            ) : error || !data ? (
              <div className="bg-[var(--red-soft)] text-[var(--red)] rounded-xl p-6 sm:p-8 flex items-center justify-center gap-3">
                <span className="text-lg sm:text-xl font-semibold">
                  Unable to load status
                </span>
              </div>
            ) : (
              <div
                className="rounded-xl p-6 sm:p-8 flex items-center justify-center gap-3"
                style={{ backgroundColor: overallBg(data.status), color: overallColor(data.status) }}
              >
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: overallColor(data.status) }}></span>
                  <span className="relative inline-flex rounded-full h-3 w-3" style={{ backgroundColor: overallColor(data.status) }}></span>
                </span>
                <span className="text-lg sm:text-xl font-semibold">
                  {overallLabel(data.status)}
                </span>
              </div>
            )}
          </section>

          {/* Components Grid */}
          <section className="mb-16">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(data?.components ?? []).map((comp, index) => {
                const isDown = comp.status === "down" || comp.status === "Down";
                const isDegraded = comp.status === "degraded" || comp.status === "Degraded Performance";
                const statusText = isDown ? "Down" : isDegraded ? "Degraded Performance" : "Operational";
                const bars = Array.from({ length: 90 }, (_, i) => {
                  if (isDown) return false;
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
                            isDown
                              ? "bg-[var(--red-soft)] text-[var(--red)]"
                              : isDegraded
                                ? "bg-[var(--gold-soft)] text-[var(--text)]"
                                : "bg-[var(--good-soft)] text-[var(--good)]"
                          }`}
                        >
                          {statusText}
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
                                : isDown
                                  ? "bg-[var(--red-soft)]"
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
              {(data?.incidents ?? []).map((incident) => (
                <Card
                  key={incident.id}
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
                    <span className={`inline-block mt-3 text-xs font-medium ${incident.status === "resolved" ? "text-[var(--good)]" : "text-[var(--gold)]"}`}>
                      {incident.status === "resolved" ? "Resolved" : incident.status === "monitoring" ? "Monitoring" : "Investigating"}
                    </span>
                  </CardContent>
                </Card>
              ))}
              {data && data.incidents.length === 0 && (
                <p className="text-[var(--muted)] text-sm">No incidents reported recently.</p>
              )}
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
              </CardContent>
            </Card>
          </section>
        </main>
      </div>
    </PublicLayout>
  );
}
