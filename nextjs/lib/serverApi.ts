import { headers } from 'next/headers'
import { request as httpRequest } from 'node:http'

/**
 * How long a metadata/SEO fetch may block a page render.
 *
 * These calls feed structured data, sitemaps and titles — all of which degrade
 * gracefully to null. None of them is worth making a visitor wait. Without a
 * cap the undici default connect timeout is ~10s, which is exactly how long
 * every church homepage took to render in production: see below.
 */
const FETCH_TIMEOUT_MS = 2500

/** The tenant's hostname, from the request. This is the whole tenant signal. */
async function tenantHostname(): Promise<string> {
  const h = await headers()
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'localhost:3005'
  return host.split(':')[0]
}

/**
 * Where server-side code should reach the church API.
 *
 * `API_INTERNAL_ORIGIN` wins in a cluster. The old behaviour — always
 * `http://<tenant-host>:3002` — is correct in local dev but catastrophic in
 * production: inside the pod that hostname resolves to the node's *public* IP,
 * where nothing listens on 3002 (nginx has 80/443, the API is a NodePort). The
 * connection was filtered rather than refused, so each call sat until undici's
 * connect timeout fired at ~10.5s. StructuredData runs in the root layout, so
 * **every page of every church took 10.5 seconds to send its first byte**, at
 * 0% CPU the whole time.
 */
export async function tenantApiOrigin(): Promise<string> {
  if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL
  if (process.env.API_INTERNAL_ORIGIN) return process.env.API_INTERNAL_ORIGIN
  return `http://${await tenantHostname()}:3002`
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
 * a 500 on the page itself. It now also refuses to be slow, for the same
 * reason: a page is better off without its structured data than delayed by it.
 */
/**
 * GET over plain http with an explicit Host header.
 *
 * `fetch` cannot do this: Host is a forbidden header in the Fetch spec, so
 * undici silently drops it and sends the connection target instead. Reaching
 * the API at `http://church-api:3002` therefore arrived as tenant
 * "church-api" and 404'd — fast, but with every church's structured data
 * quietly empty. The stdlib client honours the header, and going straight to
 * the Service is ~15ms versus ~280ms for the same call routed back out through
 * the public hostname and nginx.
 */
function getWithHost(url: URL, hostHeader: string): Promise<string | null> {
  return new Promise((resolve) => {
    const req = httpRequest(
      {
        host: url.hostname,
        port: url.port || 80,
        path: url.pathname + url.search,
        headers: { Host: hostHeader, Accept: 'application/json' },
        timeout: FETCH_TIMEOUT_MS,
      },
      (res) => {
        if (!res.statusCode || res.statusCode >= 400) {
          res.resume()
          return resolve(null)
        }
        let body = ''
        res.setEncoding('utf8')
        res.on('data', (c) => (body += c))
        res.on('end', () => resolve(body))
      },
    )
    req.on('timeout', () => { req.destroy(); resolve(null) })
    req.on('error', () => resolve(null))
    req.end()
  })
}

export async function fetchTenant<T>(path: string): Promise<T | null> {
  try {
    const [origin, hostname] = await Promise.all([tenantApiOrigin(), tenantHostname()])
    const url = new URL(`${origin}${path}`)

    let raw: string | null
    if (url.protocol === 'http:' && url.hostname !== hostname) {
      // In-cluster: the tenant is not in the URL, so it must be in the header.
      raw = await getWithHost(url, hostname)
    } else {
      // Local dev: the hostname already carries the tenant.
      const res = await fetch(url, {
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
        // Content changes when admins edit it, so don't cache indefinitely.
        next: { revalidate: 300 },
      })
      raw = res.ok ? await res.text() : null
    }
    if (!raw) return null

    const body = JSON.parse(raw)
    // The API wraps list responses as { data: [...] }.
    return (body?.data ?? body) as T
  } catch {
    return null
  }
}
