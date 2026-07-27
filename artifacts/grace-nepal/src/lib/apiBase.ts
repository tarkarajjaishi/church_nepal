// Origin of the church API for this tenant.
//
// - If VITE_API_URL is set (production), use it.
// - Otherwise, call the API on the same hostname — for Replit the proxy
//   handles routing. Fall back to localhost:3002 for local dev.
export const API_ORIGIN: string =
  import.meta.env.VITE_API_URL ||
  (typeof window !== 'undefined'
    ? `${window.location.protocol}//${window.location.hostname}:3002`
    : 'http://localhost:3002');
