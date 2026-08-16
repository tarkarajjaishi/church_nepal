// Origin of the church API for this tenant.
//
// The Host header is the ONLY tenant signal: the backend takes the first DNS
// label off it to choose the database. So the browser must call the API on the
// hostname the visitor is already on. Pointing every church at one shared API
// host (api.churchnepal.com) resolves to a tenant named "api" and serves the
// wrong church with a 200 — never set NEXT_PUBLIC_API_URL to a fixed host in
// production.
//
// - NEXT_PUBLIC_API_URL wins if set. Leave it UNSET in production.
// - Browser on a real domain -> same origin (''), so every caller's
//   `${API_ORIGIN}/api/...` becomes `/api/...` and the ingress path-routes it
//   to the API with the tenant's Host header intact.
// - Browser in local dev -> the API is a separate port on the same hostname,
//   which is what makes `<slug>.localhost:3005` work against `:3002`.
// - SSR has no window, so it needs an explicit in-cluster address.
const isLocalDev = (h: string) => h === 'localhost' || h.endsWith('.localhost')

export const API_ORIGIN: string =
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof window === 'undefined'
    ? process.env.API_INTERNAL_ORIGIN || 'http://localhost:3002'
    : isLocalDev(window.location.hostname)
      ? `${window.location.protocol}//${window.location.hostname}:3002`
      : '')
