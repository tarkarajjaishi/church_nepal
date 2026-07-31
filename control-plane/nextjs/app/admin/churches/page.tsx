"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Search, Plus, Church as ChurchIcon, Users, HardDrive, Pause, Play,
  ExternalLink, AlertTriangle, Lock,
} from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/**
 * Every church on the platform.
 *
 * This page used to render six skeleton cards behind a 500ms sleep and never
 * call the API at all. That does not read as "not built yet" — it reads as a
 * page that is permanently loading, which is worse, because nobody reports it.
 */

interface Church {
  id: string;
  name: string;
  slug: string;
  status: string;
  plan: string | null;
  admin_email: string | null;
  custom_domain: string | null;
  member_count: number;
  storage_bytes: number;
  giving_total: number;
  last_active_at: string | null;
  created_at: string;
  past_due_at: string | null;
}

const STATUS_TONE: Record<string, string> = {
  active: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  suspended: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  provisioning: "bg-sky-500/10 text-sky-400 border-sky-500/20",
  failed: "bg-red-500/10 text-red-400 border-red-500/20",
};

/** Bytes as a person reads them. */
function bytes(n: number): string {
  if (!n) return "0 MB";
  const mb = n / 1024 / 1024;
  if (mb < 1024) return `${mb.toFixed(mb < 10 ? 1 : 0)} MB`;
  return `${(mb / 1024).toFixed(1)} GB`;
}

/** The number that says whether a tenant is still alive. */
function ago(iso: string | null): string {
  if (!iso) return "never";
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days} days ago`;
  if (days < 365) return `${Math.floor(days / 30)} months ago`;
  return `${Math.floor(days / 365)} years ago`;
}

export default function ChurchesPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  const { data, isLoading, isError, error, failureReason, refetch, isFetching } = useQuery({
    queryKey: ["churches"],
    queryFn: async () => (await apiClient.get<Church[]>("/churches")).data,
  });
  // While a query is retrying, `error` is null and only failureReason knows why.
  const failure = (error ?? failureReason) as (Error & { response?: { status?: number } }) | null;
  const forbidden = failure?.response?.status === 403;

  const churches = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (data ?? []).filter(
      (c) =>
        (!status || c.status === status) &&
        (!q ||
          c.name.toLowerCase().includes(q) ||
          c.slug.toLowerCase().includes(q) ||
          (c.admin_email ?? "").toLowerCase().includes(q)),
    );
  }, [data, search, status]);

  const setStatusMut = useMutation({
    mutationFn: ({ id, action }: { id: string; action: "suspend" | "reactivate" }) =>
      apiClient.post(`/churches/${id}/${action}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["churches"] }),
  });

  const totals = (data ?? []).reduce(
    (a, c) => ({
      members: a.members + (c.member_count || 0),
      storage: a.storage + (c.storage_bytes || 0),
      active: a.active + (c.status === "active" ? 1 : 0),
    }),
    { members: 0, storage: 0, active: 0 },
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-strong)]">Churches</h1>
          <p className="text-sm text-[var(--muted)] mt-0.5">
            {isLoading
              ? "Loading…"
              : `${data?.length ?? 0} on the platform · ${totals.active} active · ${totals.members.toLocaleString()} members · ${bytes(totals.storage)}`}
          </p>
        </div>
        <div className="flex gap-2">
          <div className="relative flex-1 md:max-w-xs">
            <Search
              className="absolute left-2 top-1/2 -translate-y-1/2 text-[var(--muted)]"
              size={18}
              aria-hidden
            />
            <Input
              placeholder="Name, slug or admin email"
              aria-label="Search churches"
              className="pl-8 h-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            aria-label="Filter by status"
            className="h-10 rounded-md border border-[var(--border)] bg-[var(--panel)] px-3 text-sm"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">Any status</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="provisioning">Provisioning</option>
            <option value="failed">Failed</option>
          </select>
          <Button asChild className="gap-2">
            <Link href="/admin/churches/new">
              <Plus size={16} aria-hidden />
              Add church
            </Link>
          </Button>
        </div>
      </div>

      {isError || (!isLoading && !isFetching && !data) ? (
        <Card className="bg-[var(--panel)] border border-[var(--border)] rounded-xl p-10 text-center">
          {forbidden ? (
            <>
              <Lock className="size-6 mx-auto mb-2 text-[var(--muted)]" aria-hidden />
              <p className="font-medium">You do not have access to this</p>
              <p className="text-sm text-[var(--muted)] mt-1">
                Listing churches needs a higher role. Ask an owner.
              </p>
            </>
          ) : (
            <>
              <AlertTriangle className="size-6 mx-auto mb-2 text-red-400" aria-hidden />
              <p className="font-medium">Could not load the churches</p>
              <p className="text-sm text-[var(--muted)] mt-1">{failure?.message}</p>
              <Button variant="outline" className="mt-4" onClick={() => refetch()}>
                Try again
              </Button>
            </>
          )}
        </Card>
      ) : isLoading || !data ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="bg-[var(--panel)] border border-[var(--border)] rounded-xl p-5">
              <Skeleton className="h-5 w-3/4 mb-3" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-5/6 mb-4" />
              <Skeleton className="h-8 w-24" />
            </Card>
          ))}
        </div>
      ) : !churches.length ? (
        <Card className="bg-[var(--panel)] border border-[var(--border)] rounded-xl p-10 text-center">
          <ChurchIcon className="size-6 mx-auto mb-2 text-[var(--muted)]" aria-hidden />
          <p className="font-medium">
            {search || status ? "Nothing matches that" : "No churches yet"}
          </p>
          <p className="text-sm text-[var(--muted)] mt-1">
            {search || status
              ? "Try a different search or status."
              : "Provision the first church to get started."}
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {churches.map((c) => (
            <Card
              key={c.id}
              className="bg-[var(--panel)] border border-[var(--border)] rounded-xl p-5 flex flex-col gap-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="font-semibold truncate">{c.name}</h2>
                  <p className="text-xs text-[var(--muted)] truncate">
                    {c.custom_domain || `${c.slug}.churchnepal.com`}
                  </p>
                </div>
                <span
                  className={`shrink-0 text-xs px-2 py-0.5 rounded-full border ${
                    STATUS_TONE[c.status] ?? STATUS_TONE.failed
                  }`}
                >
                  {c.status}
                </span>
              </div>

              <dl className="grid grid-cols-3 gap-2 text-sm">
                <div>
                  <dt className="text-xs text-[var(--muted)] flex items-center gap-1">
                    <Users size={12} aria-hidden /> Members
                  </dt>
                  <dd className="tabular-nums">{(c.member_count || 0).toLocaleString()}</dd>
                </div>
                <div>
                  <dt className="text-xs text-[var(--muted)] flex items-center gap-1">
                    <HardDrive size={12} aria-hidden /> Storage
                  </dt>
                  <dd className="tabular-nums">{bytes(c.storage_bytes)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-[var(--muted)]">Plan</dt>
                  <dd>{c.plan || "Free"}</dd>
                </div>
              </dl>

              <p className="text-xs text-[var(--muted)]">
                Last active {ago(c.last_active_at)}
                {/* A tenant that stopped paying is the one worth seeing first. */}
                {c.past_due_at && (
                  <span className="text-amber-400">
                    {" "}· past due since {c.past_due_at.slice(0, 10)}
                  </span>
                )}
              </p>

              <div className="flex items-center gap-2 mt-auto pt-2">
                <Button asChild variant="outline" size="sm">
                  <Link href={`/admin/churches/${c.id}`}>Open</Link>
                </Button>
                <a
                  href={`http://${c.custom_domain || `${c.slug}.churchnepal.com`}`}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`Visit the ${c.name} website`}
                  title="Visit the site"
                  className="inline-flex items-center justify-center size-8 rounded-md hover:bg-[var(--border)]"
                >
                  <ExternalLink size={14} aria-hidden />
                </a>
                <Button
                  variant="outline"
                  size="sm"
                  className="ml-auto gap-1.5"
                  disabled={setStatusMut.isPending}
                  aria-label={
                    c.status === "suspended" ? `Reactivate ${c.name}` : `Suspend ${c.name}`
                  }
                  onClick={() => {
                    const action = c.status === "suspended" ? "reactivate" : "suspend";
                    if (
                      action === "reactivate" ||
                      confirm(`Suspend ${c.name}? Their site stops serving until reactivated.`)
                    ) {
                      setStatusMut.mutate({ id: c.id, action });
                    }
                  }}
                >
                  {c.status === "suspended" ? (
                    <>
                      <Play size={14} aria-hidden /> Reactivate
                    </>
                  ) : (
                    <>
                      <Pause size={14} aria-hidden /> Suspend
                    </>
                  )}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
