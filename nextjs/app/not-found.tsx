import { NotFoundContent } from "@/components/site/NotFoundContent";

/**
 * Root 404 — this is what any unmatched URL actually hits.
 *
 * Without it, Next falls back to its unstyled built-in ("404: This page could
 * not be found"), which is what every mistyped URL used to get: no branding, no
 * way back into the site. The designed page under (site) only fires for
 * explicit notFound() calls, and nothing calls it.
 */
export default function NotFound() {
  return (
    <main className="min-h-screen bg-background">
      <NotFoundContent />
    </main>
  );
}
