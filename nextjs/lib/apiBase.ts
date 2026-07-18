// Origin of the church API for this tenant.
//
// - If NEXT_PUBLIC_API_URL is set (production), use it.
// - Otherwise, in the browser, call the API on the SAME hostname on port 3002 —
//   so `alphachurch.localhost:3002` carries the subdomain and the backend routes
//   the request to the `alphachurch` database. This is what makes per-church
//   sites work locally at `<slug>.localhost:3005`.
// - On the server (SSR) with no env, fall back to localhost.
export const API_ORIGIN: string =
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== 'undefined'
    ? `${window.location.protocol}//${window.location.hostname}:3002`
    : 'http://localhost:3002')
