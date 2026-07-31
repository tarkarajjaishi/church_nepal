"use client";

import { AlertTriangle, Lock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * The pieces every platform page needs, so thirteen pages agree on what a
 * loading state, a refusal and a headline figure look like.
 */

export function PageTitle({ title, subtitle, actions }: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold text-[var(--text-strong)]">{title}</h1>
        {subtitle && <p className="text-sm text-[var(--muted)] mt-0.5">{subtitle}</p>}
      </div>
      {actions}
    </div>
  );
}

export function Stat({ label, value, hint, tone }: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  tone?: "good" | "warn" | "bad";
}) {
  const colour =
    tone === "bad" ? "text-red-400" : tone === "warn" ? "text-amber-400" :
    tone === "good" ? "text-emerald-400" : "";
  return (
    <Card className="bg-[var(--panel)] border border-[var(--border)] rounded-xl p-5">
      <p className="text-xs uppercase tracking-wide text-[var(--muted)]">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${colour}`}>{value}</p>
      {hint && <p className="text-xs text-[var(--muted)] mt-1">{hint}</p>}
    </Card>
  );
}

/**
 * One state for "it did not load".
 *
 * A refusal and a failure are different things and are said differently — a
 * 403 rendered as an empty table tells an operator the platform has no data
 * when it means they may not see it.
 */
export function Failed({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const e = error as (Error & { response?: { status?: number } }) | null;
  const forbidden = e?.response?.status === 403;
  return (
    <Card className="bg-[var(--panel)] border border-[var(--border)] rounded-xl p-10 text-center">
      {forbidden ? (
        <>
          <Lock className="size-6 mx-auto mb-2 text-[var(--muted)]" aria-hidden />
          <p className="font-medium">You do not have access to this</p>
          <p className="text-sm text-[var(--muted)] mt-1">
            This needs a higher role. Ask an owner.
          </p>
        </>
      ) : (
        <>
          <AlertTriangle className="size-6 mx-auto mb-2 text-red-400" aria-hidden />
          <p className="font-medium">Could not load this</p>
          <p className="text-sm text-[var(--muted)] mt-1">{e?.message}</p>
          {onRetry && (
            <Button variant="outline" className="mt-4" onClick={onRetry}>
              Try again
            </Button>
          )}
        </>
      )}
    </Card>
  );
}

export function Loading({ rows = 5 }: { rows?: number }) {
  return (
    <Card className="bg-[var(--panel)] border border-[var(--border)] rounded-xl p-5 space-y-3">
      {[...Array(rows)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
    </Card>
  );
}

export function Empty({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <Card className="bg-[var(--panel)] border border-[var(--border)] rounded-xl p-10 text-center">
      <p className="font-medium">{title}</p>
      {subtitle && <p className="text-sm text-[var(--muted)] mt-1">{subtitle}</p>}
    </Card>
  );
}

/** Bytes as a person reads them. */
export function bytes(n: number): string {
  if (!n) return "0";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let v = n;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) { v /= 1024; i++; }
  return `${v.toFixed(v < 10 && i > 0 ? 1 : 0)} ${units[i]}`;
}

export const rupees = (n: number) => `Rs ${(n || 0).toLocaleString("en-IN")}`;

export function Table({ head, children }: { head: string[]; children: React.ReactNode }) {
  return (
    <Card className="bg-[var(--panel)] border border-[var(--border)] rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-[var(--border)]">
            <tr>
              {head.map((h) => (
                <th
                  key={h}
                  scope="col"
                  className="text-left px-4 py-3 font-medium text-[var(--muted)] whitespace-nowrap"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>{children}</tbody>
        </table>
      </div>
    </Card>
  );
}

export const TR = "border-b border-[var(--border)] last:border-0";
export const TD = "px-4 py-3";
