"use client";

import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { ExternalLink, ArrowLeft } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { PageTitle, Stat, Failed, Loading, rupees } from "@/components/platform";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

/**
 * One church, as the platform sees it.
 *
 * This said "Church not found." for every church that exists. It called
 * `fetch('/api/admin/churches/{id}')` — a relative URL, so it went to the Next
 * server on 3200 rather than the API on 3100; at a path that does not exist
 * either way; with no Authorization header; from inside the render body rather
 * than an effect, so it re-fired on every render. Any one of those was enough.
 *
 * apiClient handles the origin and the token, which is why everything else in
 * this console uses it.
 */

interface Church {
  id: string;
  name: string;
  slug: string;
  db_name: string;
  subdomain: string;
  admin_email: string;
  status: string;
  plan: string | null;
  custom_domain: string | null;
  created_at: string;
  last_active_at: string | null;
  member_count: number;
  giving_total: number;
}

export default function ChurchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const q = useQuery({
    queryKey: ["church", id],
    queryFn: async () => (await apiClient.get<Church>(`/churches/${id}`)).data,
  });

  const c = q.data;

  return (
    <div className="space-y-6">
      <Link
        href="/admin/churches"
        className="inline-flex items-center gap-1.5 text-sm text-[var(--muted)] hover:underline"
      >
        <ArrowLeft size={14} aria-hidden /> All churches
      </Link>

      {q.isError ? (
        <Failed error={q.error} onRetry={() => q.refetch()} />
      ) : !c ? (
        <Loading />
      ) : (
        <>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <PageTitle title={c.name} subtitle={c.custom_domain || c.subdomain} />
            <Button variant="outline" className="gap-2" asChild>
              <a
                href={`http://${c.slug}.localhost:3005`}
                target="_blank"
                rel="noreferrer"
              >
                <ExternalLink size={14} aria-hidden /> Open the site
              </a>
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Stat
              label="Status"
              value={c.status}
              tone={c.status === "active" ? "good" : "bad"}
            />
            <Stat label="Plan" value={c.plan || "Free"} />
            <Stat label="Members" value={c.member_count} />
            {/* Paisa on the wire; the offering module stores minor units. */}
            <Stat label="Given" value={rupees(Math.round(c.giving_total / 100))} />
          </div>

          <Card className="bg-[var(--panel)] border border-[var(--border)] rounded-xl p-5">
            <h2 className="font-semibold mb-4">Details</h2>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 text-sm">
              {[
                ["Slug", c.slug],
                ["Database", c.db_name],
                ["Administrator", c.admin_email],
                ["Subdomain", c.subdomain],
                ["Custom domain", c.custom_domain || "none"],
                ["Created", c.created_at.slice(0, 10)],
                ["Last active", c.last_active_at ? c.last_active_at.slice(0, 10) : "never"],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 border-b border-[var(--border)] pb-2">
                  <dt className="text-[var(--muted)]">{k}</dt>
                  <dd className="text-right break-all">{v}</dd>
                </div>
              ))}
            </dl>
          </Card>

          <div className="flex flex-wrap gap-3">
            <Button variant="outline" asChild>
              <Link href={`/admin/churches/${c.id}/billing`}>Billing</Link>
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
