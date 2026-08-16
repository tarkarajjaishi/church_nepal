export type Church = {
  name: string;
  slug: string;
  subdomain: string;
  city?: string | null;
  district?: string | null;
  province?: string | null;
};

const API = process.env.NEXT_PUBLIC_CONTROL_API || '/api';

/**
 * Server-side base for the control API.
 *
 * NEXT_PUBLIC_CONTROL_API is "/api" so the browser stays same-origin, but a
 * relative URL has no host to resolve against on the server, so anything
 * rendering on the server has to name the in-cluster service.
 */
export function apiBase(): string {
  return API.startsWith('http') ? API : 'http://control-api:3100/api';
}

export async function getChurches(): Promise<Church[]> {
  try {
    const res = await fetch(`${apiBase()}/public/churches`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    // A directory missing its listings is recoverable; a 500 on the page is not.
    return [];
  }
}

/** URL-safe city key: "Kathmandu" -> "kathmandu", "Bharatpur " -> "bharatpur". */
export function citySlug(city: string): string {
  return city.trim().toLowerCase().replace(/\s+/g, '-');
}

/** Title-cased display name recovered from a slug, for pages with no listings yet. */
export function cityLabel(slug: string): string {
  return slug
    .split('-')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

/**
 * Cities that get a page.
 *
 * The union of cities we actually have churches in and a fixed list of Nepal's
 * larger cities. The fixed list exists so the pages are reachable and coherent
 * before the directory fills up — each one says plainly when it has no
 * listings rather than implying churches exist there.
 */
export const SEED_CITIES = [
  'Kathmandu', 'Lalitpur', 'Bhaktapur', 'Pokhara', 'Chitwan', 'Bharatpur',
  'Biratnagar', 'Dharan', 'Itahari', 'Butwal', 'Nepalgunj', 'Hetauda',
  'Birgunj', 'Dhangadhi', 'Janakpur',
] as const;

export function allCities(churches: Church[]): string[] {
  const seen = new Map<string, string>();
  for (const c of SEED_CITIES) seen.set(citySlug(c), c);
  for (const c of churches) {
    if (c.city?.trim()) seen.set(citySlug(c.city), c.city.trim());
  }
  return [...seen.values()].sort((a, b) => a.localeCompare(b));
}

export function churchesInCity(churches: Church[], slug: string): Church[] {
  return churches.filter((c) => c.city && citySlug(c.city) === slug);
}
