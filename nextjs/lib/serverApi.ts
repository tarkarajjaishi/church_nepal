import { headers } from 'next/headers'

/**
 * Tenant-aware API access for server-side code (sitemap, generateMetadata).
 *
 * lib/apiBase.ts resolves the tenant from `window.location.hostname`, which
 * only works in the browser — on the server it falls back to localhost and
 * would silently serve the DEFAULT tenant's content to every church. Here we
 * take the tenant from the request's Host header instead, which is the same
 * signal the Rust backend uses to pick the database.
 *
 * Using headers() opts the caller into dynamic rendering. That is required:
 * a multi-tenant sitemap cannot be statically generated at build time.
 */
export async function tenantApiOrigin(): Promise<string> {
  if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL

  const host = (await headers()).get('host') ?? 'localhost:3005'
  const hostname = host.split(':')[0]
  return `http://${hostname}:3002`
}

/**
 * Public site origin for this tenant — used to build absolute sitemap URLs.
 *
 * The request's host wins over NEXT_PUBLIC_SITE_URL, not the other way round:
 * every church is served by this same deployment, so a single configured
 * origin would put one church's domain in every church's sitemap. The env var
 * is only a fallback for contexts with no request (e.g. build-time tooling).
 */
export async function tenantSiteOrigin(): Promise<string> {
  const h = await headers()
  const host = h.get('x-forwarded-host') ?? h.get('host')
  if (!host) return process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3005'

  const proto =
    h.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https')
  return `${proto}://${host}`
}

/**
 * GET a public API path for the current tenant.
 *
 * Returns null rather than throwing: this feeds the sitemap and page metadata,
 * where a failed fetch should degrade to fewer URLs or a default title — never
 * a 500 on the page itself.
 */
export async function fetchTenant<T>(path: string): Promise<T | null> {
  try {
    const origin = await tenantApiOrigin()
    const res = await fetch(`${origin}${path}`, {
      // Content changes when admins edit it, so don't cache indefinitely.
      next: { revalidate: 300 },
    })
    if (!res.ok) return null
    const body = await res.json()
    // The API wraps list responses as { data: [...] }.
    return (body?.data ?? body) as T
  } catch {
    return null
  }
}
