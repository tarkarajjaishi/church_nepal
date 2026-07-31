import { Construction } from "lucide-react";
import { Card } from "@/components/ui/card";

/**
 * A page that is planned but has nothing behind it.
 *
 * Deliberately explicit. The pages this replaces rendered skeleton cards
 * behind a `setTimeout` and never called an API — which does not read as "not
 * built", it reads as permanently loading, so nobody reports it and nobody
 * knows the difference between a broken page and an absent one.
 *
 * Showing plausible fake numbers would be worse still: a console that governs
 * real churches must never invent a figure.
 */
export function NotBuiltYet({
  title,
  subtitle,
  planned,
  dependsOn,
}: {
  title: string;
  subtitle?: string;
  planned: string[];
  dependsOn?: string;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-strong)]">{title}</h1>
        {subtitle && <p className="text-sm text-[var(--muted)] mt-0.5">{subtitle}</p>}
      </div>

      <Card className="bg-[var(--panel)] border border-[var(--border)] rounded-xl p-6 sm:p-8">
        <div className="flex items-start gap-4">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/10">
            <Construction className="size-5 text-amber-400" aria-hidden />
          </div>
          <div className="min-w-0">
            <h2 className="font-semibold text-[var(--text-strong)]">Not built yet</h2>
            <p className="text-sm text-[var(--muted)] mt-1 max-w-prose">
              This page is part of the control plane plan but has no implementation
              behind it. It is listed in the navigation so the shape of the console
              is visible, and it shows nothing rather than placeholder figures.
            </p>

            <h3 className="text-sm font-medium text-[var(--text-strong)] mt-5 mb-2">
              Planned for this page
            </h3>
            <ul className="space-y-1.5">
              {planned.map((p) => (
                <li key={p} className="flex items-start gap-2 text-sm text-[var(--muted)]">
                  <span
                    className="mt-1.5 size-1.5 rounded-full bg-[var(--muted)] shrink-0"
                    aria-hidden
                  />
                  {p}
                </li>
              ))}
            </ul>

            {dependsOn && (
              <p className="mt-4 text-xs text-[var(--muted)]">
                <span className="font-medium text-[var(--text-strong)]">Depends on:</span>{" "}
                {dependsOn}
              </p>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
